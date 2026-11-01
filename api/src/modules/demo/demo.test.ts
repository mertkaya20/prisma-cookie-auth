import request from "supertest";
import { describe, expect, it } from "vitest";
import { server } from "../../server.js";
import { db } from "../../shared/db.js";
import {
  as,
  createOrganization,
  sessionCookie,
} from "../../shared/test/fixtures.js";

const createDemo = () => request(server).post("/auth/demo");

const me = (cookie: string) =>
  request(server).get("/auth/me").set("Cookie", cookie);

const makeOld = (organizationId: string) =>
  db.organization.update({
    where: { id: organizationId },
    data: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
  });

const countRows = async (organizationId: string) => ({
  organizations: await db.organization.count({ where: { id: organizationId } }),
  users: await db.user.count({ where: { organizationId } }),
  projects: await db.project.count({ where: { organizationId } }),
  projectMembers: await db.projectMember.count({ where: { organizationId } }),
  tasks: await db.task.count({ where: { organizationId } }),
  assignees: await db.taskAssignee.count({ where: { organizationId } }),
  tags: await db.tag.count({ where: { organizationId } }),
  taskTags: await db.taskTag.count({ where: { organizationId } }),
  comments: await db.comment.count({ where: { organizationId } }),
});

describe("POST /auth/demo", () => {
  it("X1: creates a demo and logs the visitor in as its owner", async () => {
    const res = await createDemo();

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ role: "owner" });
    expect(res.body.user).not.toHaveProperty("passwordHash");

    const meRes = await me(sessionCookie(res));
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.id).toBe(res.body.user.id);
  });

  it("X2: fills a demo organization with people, projects, tasks, tags and comments", async () => {
    const res = await createDemo();
    const { organizationId } = res.body.user;

    const organization = await db.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    expect(organization.isDemo).toBe(true);

    const rows = await countRows(organizationId);
    expect(rows.users).toBeGreaterThanOrEqual(3);
    expect(rows.projects).toBeGreaterThanOrEqual(2);
    expect(rows.projectMembers).toBeGreaterThanOrEqual(1);
    expect(rows.tasks).toBeGreaterThanOrEqual(5);
    expect(rows.assignees).toBeGreaterThanOrEqual(1);
    expect(rows.tags).toBeGreaterThanOrEqual(1);
    expect(rows.taskTags).toBeGreaterThanOrEqual(1);
    expect(rows.comments).toBeGreaterThanOrEqual(1);

    // Demo e-postaları gerçek birine ait olamayacak.
    const users = await db.user.findMany({ where: { organizationId } });
    for (const user of users) {
      expect(user.email).toMatch(/@example\.com$/);
    }
  });

  it("X3: two demos in a row get separate organizations without an email clash", async () => {
    const first = await createDemo();
    const second = await createDemo();

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.user.organizationId).not.toBe(
      first.body.user.organizationId,
    );
    expect(second.body.user.email).not.toBe(first.body.user.email);
    expect(await db.organization.count({ where: { isDemo: true } })).toBe(2);
  });

  it("X4: a visitor only sees their own demo's projects", async () => {
    const first = await createDemo();
    await createDemo();
    const firstOrgId = first.body.user.organizationId;

    const res = await request(server)
      .get("/projects")
      .set("Cookie", sessionCookie(first));

    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(
      await db.project.count({ where: { organizationId: firstOrgId } }),
    );
    for (const project of res.body.projects) {
      expect(project.organizationId).toBe(firstOrgId);
    }
  });

  it("X5: deletes demos older than 24 hours with everything in them", async () => {
    const old = await createDemo();
    const oldCookie = sessionCookie(old);
    const oldOrgId = old.body.user.organizationId;
    await makeOld(oldOrgId);

    const res = await createDemo();

    expect(res.status).toBe(201);
    expect(await countRows(oldOrgId)).toEqual({
      organizations: 0,
      users: 0,
      projects: 0,
      projectMembers: 0,
      tasks: 0,
      assignees: 0,
      tags: 0,
      taskTags: 0,
      comments: 0,
    });
    expect(
      await db.session.count({ where: { userId: old.body.user.id } }),
    ).toBe(0);
    expect((await me(oldCookie)).status).toBe(401);
  });

  it("X6: never touches a real organization, however old", async () => {
    const real = await createOrganization("real");
    const task = await db.task.create({
      data: {
        organizationId: real.organization.id,
        projectId: real.project.id,
        title: "Real task",
        createdById: real.owner.user.id,
      },
    });
    await db.comment.create({
      data: {
        organizationId: real.organization.id,
        taskId: task.id,
        authorId: real.contributor.user.id,
        body: "Real comment",
      },
    });
    await makeOld(real.organization.id);
    const before = await countRows(real.organization.id);

    const res = await createDemo();

    expect(res.status).toBe(201);
    expect(await countRows(real.organization.id)).toEqual(before);
    expect((await as(real.owner).get("/auth/me")).status).toBe(200);
  });

  it("X7: keeps demos younger than 24 hours", async () => {
    const recent = await createDemo();
    const recentOrgId = recent.body.user.organizationId;
    const before = await countRows(recentOrgId);

    const res = await createDemo();

    expect(res.status).toBe(201);
    expect(await countRows(recentOrgId)).toEqual(before);
    expect((await me(sessionCookie(recent))).status).toBe(200);
  });
});
