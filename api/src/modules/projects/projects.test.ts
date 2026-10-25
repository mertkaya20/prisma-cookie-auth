import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../shared/db.js";
import {
  as,
  createOrganization,
  type TestOrganization,
} from "../../shared/test/fixtures.js";

let alpha: TestOrganization;
let beta: TestOrganization;

beforeEach(async () => {
  alpha = await createOrganization("alpha");
  beta = await createOrganization("beta");
});

const project = (id = alpha.project.id) => `/projects/${id}`;

describe("reading projects", () => {
  it("P1: lists only my organization's projects", async () => {
    await db.project.create({
      data: { organizationId: alpha.organization.id, name: "Mobile" },
    });

    const res = await as(alpha.outsider).get("/projects");

    expect(res.status).toBe(200);
    const names = res.body.projects.map((p: { name: string }) => p.name).sort();
    expect(names).toEqual(["Mobile", "Web"]);
    const orgs = new Set(
      res.body.projects.map(
        (p: { organizationId: string }) => p.organizationId,
      ),
    );
    expect([...orgs]).toEqual([alpha.organization.id]);
  });

  it("P2: any member can get a project", async () => {
    for (const actor of [
      alpha.owner,
      alpha.manager,
      alpha.contributor,
      alpha.outsider,
    ]) {
      const res = await as(actor).get(project());
      expect(res.status, actor.user.email).toBe(200);
    }
  });
});

describe("managing projects", () => {
  it("P3: the owner creates a project", async () => {
    const res = await as(alpha.owner)
      .post("/projects")
      .send({ name: "Mobile" });

    expect(res.status).toBe(201);
    expect(res.body.project).toMatchObject({
      name: "Mobile",
      organizationId: alpha.organization.id,
    });
  });

  it("P4: nobody but the owner can create, edit or delete, not even the project manager", async () => {
    for (const actor of [alpha.manager, alpha.contributor, alpha.outsider]) {
      const create = await as(actor).post("/projects").send({ name: "Mobile" });
      const edit = await as(actor).patch(project()).send({ name: "Renamed" });
      const remove = await as(actor).delete(project());

      expect(create.status, actor.user.email).toBe(403);
      expect(edit.status, actor.user.email).toBe(403);
      expect(remove.status, actor.user.email).toBe(403);
    }

    expect(
      await db.project.count({
        where: { organizationId: alpha.organization.id },
      }),
    ).toBe(1);
  });

  it("P5: rejects a name that already exists in the organization", async () => {
    const create = await as(alpha.owner)
      .post("/projects")
      .send({ name: "Web" });
    expect(create.status).toBe(409);
    expect(create.body.error.code).toBe("PROJECT_NAME_TAKEN");

    const mobile = await db.project.create({
      data: { organizationId: alpha.organization.id, name: "Mobile" },
    });
    const rename = await as(alpha.owner)
      .patch(project(mobile.id))
      .send({ name: "Web" });
    expect(rename.status).toBe(409);
  });

  it("P6: the same name is allowed in another organization", async () => {
    await db.project.create({
      data: { organizationId: beta.organization.id, name: "Mobile" },
    });

    const res = await as(alpha.owner)
      .post("/projects")
      .send({ name: "Mobile" });

    expect(res.status).toBe(201);
  });

  it("P7: the owner renames a project and clears its description with null", async () => {
    await db.project.update({
      where: { id: alpha.project.id },
      data: { description: "Old description" },
    });

    const res = await as(alpha.owner)
      .patch(project())
      .send({ name: "Website", description: null });

    expect(res.status).toBe(200);
    expect(res.body.project).toMatchObject({
      name: "Website",
      description: null,
    });
  });

  it("P8: rejects an empty name and an empty update", async () => {
    expect(
      (await as(alpha.owner).post("/projects").send({ name: "  " })).status,
    ).toBe(400);
    expect((await as(alpha.owner).patch(project()).send({})).status).toBe(400);
  });

  it("P10: deleting a project deletes its tasks, team, comments, assignees and task tags", async () => {
    const organizationId = alpha.organization.id;
    const task = await db.task.create({
      data: {
        organizationId,
        projectId: alpha.project.id,
        title: "G1",
        createdById: alpha.owner.user.id,
      },
    });
    const tag = await db.tag.create({
      data: { organizationId, name: "urgent" },
    });
    await db.taskTag.create({
      data: { organizationId, taskId: task.id, tagId: tag.id },
    });
    await db.taskAssignee.create({
      data: {
        organizationId,
        taskId: task.id,
        userId: alpha.contributor.user.id,
      },
    });
    await db.comment.create({
      data: {
        organizationId,
        taskId: task.id,
        authorId: alpha.contributor.user.id,
        body: "Hi",
      },
    });

    const res = await as(alpha.owner).delete(project());

    expect(res.status).toBe(204);
    expect(await db.task.count({ where: { organizationId } })).toBe(0);
    expect(await db.projectMember.count({ where: { organizationId } })).toBe(0);
    expect(await db.comment.count({ where: { organizationId } })).toBe(0);
    expect(await db.taskAssignee.count({ where: { organizationId } })).toBe(0);
    expect(await db.taskTag.count({ where: { organizationId } })).toBe(0);
    // Etiket şirkete ait, projeyle birlikte silinmez.
    expect(await db.tag.count({ where: { organizationId } })).toBe(1);
  });
});

describe("tenant isolation", () => {
  it("P9: another organization cannot get, edit or delete my project", async () => {
    expect((await as(beta.owner).get(project())).status).toBe(404);
    expect(
      (await as(beta.owner).patch(project()).send({ name: "Hacked" })).status,
    ).toBe(404);
    expect((await as(beta.owner).delete(project())).status).toBe(404);

    const stored = await db.project.findUnique({
      where: { id: alpha.project.id },
    });
    expect(stored?.name).toBe("Web");
  });
});

describe("project members", () => {
  const members = (id = alpha.project.id) => `/projects/${id}/members`;
  const member = (userId: string) => `${members()}/${userId}`;

  it("M1: any member can list the team, sorted by name, without password hashes", async () => {
    const res = await as(alpha.outsider).get(members());

    expect(res.status).toBe(200);
    const team = res.body.members.map(
      (m: { role: string; user: { name: string } }) => `${m.user.name}:${m.role}`,
    );
    expect(team).toEqual(["contributor:contributor", "manager:manager"]);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("M2: the owner adds someone; the role defaults to contributor", async () => {
    const res = await as(alpha.owner).post(members()).send({ userId: alpha.outsider.user.id });

    expect(res.status).toBe(201);
    expect(res.body.member.role).toBe("contributor");
    expect(res.body.member.user.email).toBe(alpha.outsider.user.email);
  });

  it("M3: the project manager can add, change the role of and remove members", async () => {
    const outsiderId = alpha.outsider.user.id;

    const add = await as(alpha.manager).post(members()).send({ userId: outsiderId });
    expect(add.status).toBe(201);

    const promote = await as(alpha.manager).patch(member(outsiderId)).send({ role: "manager" });
    expect(promote.status).toBe(200);
    expect(promote.body.member.role).toBe("manager");

    const remove = await as(alpha.manager).delete(member(outsiderId));
    expect(remove.status).toBe(204);
  });

  it("M4: contributors and people outside the team cannot manage it", async () => {
    for (const actor of [alpha.contributor, alpha.outsider]) {
      const add = await as(actor).post(members()).send({ userId: alpha.owner.user.id });
      const promote = await as(actor)
        .patch(member(alpha.contributor.user.id))
        .send({ role: "manager" });
      const remove = await as(actor).delete(member(alpha.manager.user.id));

      expect(add.status, actor.user.email).toBe(403);
      expect(promote.status, actor.user.email).toBe(403);
      expect(remove.status, actor.user.email).toBe(403);
    }

    expect(await db.projectMember.count({ where: { projectId: alpha.project.id } })).toBe(2);
  });

  it("M5: a user from another organization cannot be added", async () => {
    const res = await as(alpha.owner).post(members()).send({ userId: beta.contributor.user.id });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("M6: someone already in the team cannot be added again", async () => {
    const res = await as(alpha.owner).post(members()).send({ userId: alpha.contributor.user.id });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("USER_ALREADY_PROJECT_MEMBER");
  });

  it("M7: changing or removing someone outside the team returns 404", async () => {
    const outsiderId = alpha.outsider.user.id;

    expect((await as(alpha.owner).patch(member(outsiderId)).send({ role: "manager" })).status).toBe(404);
    expect((await as(alpha.owner).delete(member(outsiderId))).status).toBe(404);
  });

  it("M8: rejects an organization role as a project role", async () => {
    const res = await as(alpha.owner)
      .post(members())
      .send({ userId: alpha.outsider.user.id, role: "owner" });

    expect(res.status).toBe(400);
  });

  it("M9: another organization cannot see or change my team", async () => {
    expect((await as(beta.owner).get(members())).status).toBe(404);

    const promote = await as(beta.owner)
      .patch(member(alpha.contributor.user.id))
      .send({ role: "manager" });
    expect(promote.status).toBe(404);

    const stored = await db.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: alpha.project.id, userId: alpha.contributor.user.id },
      },
    });
    expect(stored?.role).toBe("contributor");
  });

  it("M10: a removed member keeps their assignments but can no longer edit the task", async () => {
    const task = await db.task.create({
      data: {
        organizationId: alpha.organization.id,
        projectId: alpha.project.id,
        title: "G1",
        createdById: alpha.owner.user.id,
      },
    });
    await db.taskAssignee.create({
      data: {
        organizationId: alpha.organization.id,
        taskId: task.id,
        userId: alpha.contributor.user.id,
      },
    });

    const remove = await as(alpha.owner).delete(member(alpha.contributor.user.id));
    expect(remove.status).toBe(204);

    const stored = await as(alpha.owner).get(`/tasks/${task.id}`);
    expect(stored.body.task.assignees[0].user.email).toBe(alpha.contributor.user.email);

    const edit = await as(alpha.contributor).patch(`/tasks/${task.id}`).send({ status: "done" });
    expect(edit.status).toBe(403);
  });
});
