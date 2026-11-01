import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../server.js";
import { db } from "../../shared/db.js";
import {
  Actor,
  as,
  createOrganization,
  PASSWORD,
  sessionCookie,
  type TestOrganization,
} from "../../shared/test/fixtures.js";

let alpha: TestOrganization;
let beta: TestOrganization;

beforeEach(async () => {
  alpha = await createOrganization("alpha");
  beta = await createOrganization("beta");
});

const newUser = {
  email: "new@alpha.test",
  name: "New",
  password: "new-password-123",
};

describe("GET /users", () => {
  it("U1: lists only the users of my organization, without password hashes", async () => {
    const res = await as(alpha.outsider).get("/users");

    expect(res.status).toBe(200);
    const emails = res.body.users.map((u: { email: string }) => u.email).sort();
    expect(emails).toEqual([
      "contributor@alpha.test",
      "manager@alpha.test",
      "outsider@alpha.test",
      "owner@alpha.test",
    ]);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("U8: rejects a request without a cookie", async () => {
    const res = await request(server).get("/users");

    expect(res.status).toBe(401);
  });
});

describe("POST /users", () => {
  it("U2: the owner adds a member who can then log in", async () => {
    const res = await as(alpha.owner).post("/users").send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: newUser.email,
      role: "member",
      organizationId: alpha.organization.id,
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");

    const login = await request(server)
      .post("/auth/login")
      .send({ email: newUser.email, password: newUser.password });
    expect(login.status).toBe(200);
  });

  it("U3: the owner can add another owner", async () => {
    const res = await as(alpha.owner)
      .post("/users")
      .send({ ...newUser, role: "owner" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("owner");
  });

  it("U4: members cannot add users", async () => {
    for (const actor of [alpha.manager, alpha.contributor, alpha.outsider]) {
      const res = await as(actor).post("/users").send(newUser);
      expect(res.status, actor.user.email).toBe(403);
    }

    expect(await db.user.count({ where: { email: newUser.email } })).toBe(0);
  });

  it("U5: rejects an email that is already registered, in any organization", async () => {
    const sameOrg = await as(alpha.owner)
      .post("/users")
      .send({ ...newUser, email: alpha.contributor.user.email });
    expect(sameOrg.status).toBe(409);
    expect(sameOrg.body.error.code).toBe("EMAIL_TAKEN");

    // E-postalar bütün sistemde benzersiz; başka şirketteki e-posta da 409 alır (bilinen bedel).
    const otherOrg = await as(alpha.owner)
      .post("/users")
      .send({ ...newUser, email: beta.contributor.user.email });
    expect(otherOrg.status).toBe(409);
  });

  it("U6: rejects an invalid body", async () => {
    const invalid = [
      { ...newUser, email: "not-an-email" },
      { ...newUser, password: "short" },
      { ...newUser, role: "admin" },
    ];

    for (const body of invalid) {
      const res = await as(alpha.owner).post("/users").send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
    expect(await db.user.count({ where: { email: newUser.email } })).toBe(0);
  });

  it("U7: ignores an organizationId in the body", async () => {
    const res = await as(alpha.owner)
      .post("/users")
      .send({ ...newUser, organizationId: beta.organization.id });

    expect(res.status).toBe(201);
    expect(res.body.user.organizationId).toBe(alpha.organization.id);
  });
});

describe("POST /users/:id/deactivate and /activate", () => {
  const deactivate = (actor: Actor, target: Actor) =>
    as(actor).post(`/users/${target.user.id}/deactivate`);
  const activate = (actor: Actor, target: Actor) =>
    as(actor).post(`/users/${target.user.id}/activate`);
  const loginAs = (target: Actor) =>
    request(server)
      .post("/auth/login")
      .send({ email: target.user.email, password: PASSWORD });

  const deactivatedAtOf = async (target: Actor) =>
    (
      await db.user.findUniqueOrThrow({
        where: { id: target.user.id },
        select: { deactivatedAt: true },
      })
    ).deactivatedAt;

  const createTask = () =>
    db.task.create({
      data: {
        organizationId: alpha.organization.id,
        projectId: alpha.project.id,
        title: "G1",
        createdById: alpha.owner.user.id,
      },
    });

  it("D1: the owner deactivates a member and ends their sessions", async () => {
    const res = await deactivate(alpha.owner, alpha.contributor);

    expect(res.status).toBe(200);
    expect(res.body.user.deactivatedAt).toEqual(expect.any(String));
    expect((await as(alpha.contributor).get("/auth/me")).status).toBe(401);
    expect(
      await db.session.count({ where: { userId: alpha.contributor.user.id } }),
    ).toBe(0);
  });

  it("D2: a deactivated person can't log in, even with the right password", async () => {
    await deactivate(alpha.owner, alpha.contributor);

    const res = await loginAs(alpha.contributor);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("USER_DEACTIVATED");
    expect(res.body.error.message).toBeDefined();
    expect(res.get("Set-Cookie")).toBeUndefined();
  });

  it("D3: the owner can't deactivate themselves", async () => {
    const res = await deactivate(alpha.owner, alpha.owner);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("CANNOT_DEACTIVATE_SELF");

    expect(await deactivatedAtOf(alpha.owner)).toBeNull();
    expect((await as(alpha.owner).get("/auth/me")).status).toBe(200);
  });

  it("D4: members can't deactivate or activate anyone", async () => {
    const deactivateRes = await deactivate(alpha.manager, alpha.contributor);

    expect(deactivateRes.status).toBe(403);
    expect(await deactivatedAtOf(alpha.contributor)).toBeNull();
    expect((await as(alpha.contributor).get("/auth/me")).status).toBe(200);

    await deactivate(alpha.owner, alpha.contributor);
    const activateRes = await activate(alpha.manager, alpha.contributor);

    expect(activateRes.status).toBe(403);
    expect(await deactivatedAtOf(alpha.contributor)).not.toBeNull();
  });

  it("D5: a person from another organization looks like they don't exist", async () => {
    const res = await deactivate(alpha.owner, beta.contributor);

    expect(res.status).toBe(404);
    expect(await deactivatedAtOf(beta.contributor)).toBeNull();
    expect((await as(beta.contributor).get("/auth/me")).status).toBe(200);
  });

  it("D6: deactivating twice succeeds and keeps the first date", async () => {
    const first = await deactivate(alpha.owner, alpha.contributor);
    const second = await deactivate(alpha.owner, alpha.contributor);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.user.deactivatedAt).toBe(first.body.user.deactivatedAt);
  });

  // Eski oturumlar silindiği için geri alınan kişinin unutulmuş/çalınmış bir oturumu canlanmaz.
  it("D7: the owner activates the person again; they log in anew, old sessions stay dead", async () => {
    await deactivate(alpha.owner, alpha.contributor);

    const res = await activate(alpha.owner, alpha.contributor);

    expect(res.status).toBe(200);
    expect(res.body.user.deactivatedAt).toBeNull();

    const login = await loginAs(alpha.contributor);
    expect(login.status).toBe(200);

    expect((await as(alpha.contributor).get("/auth/me")).status).toBe(401);

    expect(
      (
        await request(server)
          .get("/auth/me")
          .set("Cookie", sessionCookie(login))
      ).status,
    ).toBe(200);
  });

  it("D8: a deactivated person can't be added to a team", async () => {
    const mobile = await db.project.create({
      data: { organizationId: alpha.organization.id, name: "Mobile" },
    });
    await deactivate(alpha.owner, alpha.contributor);

    const res = await as(alpha.owner)
      .post(`/projects/${mobile.id}/members`)
      .send({ userId: alpha.contributor.user.id });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("USER_DEACTIVATED");
    expect(
      await db.projectMember.count({ where: { projectId: mobile.id } }),
    ).toBe(0);
  });

  it("D9: a deactivated person can't be assigned to a task, even if still on the team", async () => {
    const task = await createTask();
    await deactivate(alpha.owner, alpha.contributor);

    const res = await as(alpha.manager)
      .post(`/tasks/${task.id}/assignees`)
      .send({ userId: alpha.contributor.user.id });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("USER_DEACTIVATED");
    expect(await db.taskAssignee.count({ where: { taskId: task.id } })).toBe(0);
  });

  it("D10: team memberships and assignments stay, marked as deactivated", async () => {
    const task = await createTask();
    await as(alpha.manager)
      .post(`/tasks/${task.id}/assignees`)
      .send({ userId: alpha.contributor.user.id });

    await deactivate(alpha.owner, alpha.contributor);

    const team = await as(alpha.owner).get(
      `/projects/${alpha.project.id}/members`,
    );
    const member = team.body.members.find(
      (m: { userId: string }) => m.userId === alpha.contributor.user.id,
    );
    expect(member.user.deactivatedAt).toEqual(expect.any(String));

    const taskRes = await as(alpha.owner).get(`/tasks/${task.id}`);
    expect(taskRes.body.task.assignees).toHaveLength(1);
    expect(taskRes.body.task.assignees[0].user.deactivatedAt).toEqual(
      expect.any(String),
    );
  });

  it("D11: the people list still shows a deactivated person, marked", async () => {
    await deactivate(alpha.owner, alpha.contributor);

    const res = await as(alpha.outsider).get("/users");

    const byEmail = (email: string) =>
      res.body.users.find((u: { email: string }) => u.email === email);
    expect(byEmail(alpha.contributor.user.email).deactivatedAt).toEqual(
      expect.any(String),
    );
    expect(byEmail(alpha.manager.user.email).deactivatedAt).toBeNull();
  });

  // İkinci kilit: endpoint'i atlayıp sadece alanı yazınca oturum silinmez; yine de içeri girilememeli.
  it("D12: a session left over for a deactivated person is rejected", async () => {
    await db.user.update({
      where: { id: alpha.contributor.user.id },
      data: { deactivatedAt: new Date() },
    });

    expect(
      await db.session.count({ where: { userId: alpha.contributor.user.id } }),
    ).toBe(1);
    expect((await as(alpha.contributor).get("/auth/me")).status).toBe(401);
  });
});
