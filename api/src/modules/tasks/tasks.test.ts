import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../shared/db.js";
import {
  as,
  createOrganization,
  type TestOrganization,
} from "../../shared/test/fixtures.js";

let alpha: TestOrganization;
let beta: TestOrganization;
let taskId: string;
let alphaTagId: string;
let betaTagId: string;

// Alpha: ekipli proje + bir görev + bir etiket. Beta: aynı yapıda ikinci şirket.
beforeEach(async () => {
  alpha = await createOrganization("alpha");
  beta = await createOrganization("beta");

  taskId = (
    await db.task.create({
      data: {
        organizationId: alpha.organization.id,
        projectId: alpha.project.id,
        title: "G1",
        createdById: alpha.owner.user.id,
      },
    })
  ).id;
  alphaTagId = (
    await db.tag.create({
      data: { organizationId: alpha.organization.id, name: "acil" },
    })
  ).id;
  betaTagId = (
    await db.tag.create({
      data: { organizationId: beta.organization.id, name: "acil" },
    })
  ).id;
});

const projectTasks = () => `/projects/${alpha.project.id}/tasks`;
const task = (id = taskId) => `/tasks/${id}`;

const createTask = (
  title: string,
  status: "todo" | "in_progress" | "done" = "todo",
) =>
  db.task.create({
    data: {
      organizationId: alpha.organization.id,
      projectId: alpha.project.id,
      title,
      status,
      createdById: alpha.owner.user.id,
    },
  });

describe("tenant isolation", () => {
  it("hides another organization's project", async () => {
    expect((await as(beta.owner).get(projectTasks())).status).toBe(404);
    expect(
      (await as(beta.owner).post(projectTasks()).send({ title: "x" })).status,
    ).toBe(404);
  });

  it("hides another organization's task and leaves it untouched", async () => {
    expect((await as(beta.owner).get(task())).status).toBe(404);
    expect(
      (await as(beta.owner).patch(task()).send({ title: "hacked" })).status,
    ).toBe(404);
    expect((await as(beta.owner).delete(task())).status).toBe(404);

    const stored = await db.task.findUnique({ where: { id: taskId } });
    expect(stored?.title).toBe("G1");
  });

  it("cannot assign people or add tags to another organization's task", async () => {
    const assign = await as(beta.owner)
      .post(`${task()}/assignees`)
      .send({ userId: beta.contributor.user.id });
    const tag = await as(beta.owner)
      .post(`${task()}/tags`)
      .send({ tagId: betaTagId });

    expect(assign.status).toBe(404);
    expect(tag.status).toBe(404);
  });
});

describe("permissions inside the organization", () => {
  it("Y1: everyone in the organization can read", async () => {
    for (const actor of [
      alpha.owner,
      alpha.manager,
      alpha.contributor,
      alpha.outsider,
    ]) {
      expect(
        (await as(actor).get(projectTasks())).status,
        actor.user.email,
      ).toBe(200);
      expect((await as(actor).get(task())).status, actor.user.email).toBe(200);
    }
  });

  it("Y2: the owner and the project team can create, others cannot", async () => {
    for (const actor of [alpha.owner, alpha.manager, alpha.contributor]) {
      const res = await as(actor).post(projectTasks()).send({ title: "new" });
      expect(res.status, actor.user.email).toBe(201);
    }

    const res = await as(alpha.outsider)
      .post(projectTasks())
      .send({ title: "new" });
    expect(res.status).toBe(403);
  });

  it("Y3: the owner and the project team can edit, others cannot", async () => {
    for (const actor of [alpha.owner, alpha.manager, alpha.contributor]) {
      const res = await as(actor).patch(task()).send({ status: "in_progress" });
      expect(res.status, actor.user.email).toBe(200);
    }

    const res = await as(alpha.outsider).patch(task()).send({ title: "x" });
    expect(res.status).toBe(403);
  });

  it("Y4: only the owner and the project manager can delete", async () => {
    expect((await as(alpha.contributor).delete(task())).status).toBe(403);
    expect((await as(alpha.outsider).delete(task())).status).toBe(403);

    expect((await as(alpha.manager).delete(task())).status).toBe(204);
    const second = await createTask("G2");
    expect((await as(alpha.owner).delete(task(second.id))).status).toBe(204);
  });

  it("Y5: only the owner and the project manager can assign and unassign", async () => {
    const assign = (actor: typeof alpha.owner) =>
      as(actor)
        .post(`${task()}/assignees`)
        .send({ userId: alpha.contributor.user.id });
    const unassign = (actor: typeof alpha.owner) =>
      as(actor).delete(`${task()}/assignees/${alpha.contributor.user.id}`);

    expect((await assign(alpha.contributor)).status).toBe(403);
    expect((await assign(alpha.outsider)).status).toBe(403);
    expect((await assign(alpha.manager)).status).toBe(201);

    expect((await unassign(alpha.contributor)).status).toBe(403);
    expect((await unassign(alpha.owner)).status).toBe(204);
  });

  it("Y6: the owner and the project team can add and remove tags, others cannot", async () => {
    const addTag = (actor: typeof alpha.owner) =>
      as(actor).post(`${task()}/tags`).send({ tagId: alphaTagId });
    const removeTag = (actor: typeof alpha.owner) =>
      as(actor).delete(`${task()}/tags/${alphaTagId}`);

    expect((await addTag(alpha.outsider)).status).toBe(403);
    expect((await addTag(alpha.contributor)).status).toBe(201);
    expect((await removeTag(alpha.outsider)).status).toBe(403);
    expect((await removeTag(alpha.contributor)).status).toBe(204);
  });
});

describe("business rules", () => {
  it("K1: assignees must be in the project team, and only once", async () => {
    const assign = (userId: string) =>
      as(alpha.manager).post(`${task()}/assignees`).send({ userId });

    const outsider = await assign(alpha.outsider.user.id);
    expect(outsider.status).toBe(400);
    expect(outsider.body.error.code).toBe("ASSIGNEE_NOT_IN_PROJECT");

    expect((await assign(beta.contributor.user.id)).status).toBe(400);

    expect((await assign(alpha.contributor.user.id)).status).toBe(201);
    const again = await assign(alpha.contributor.user.id);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("ALREADY_ASSIGNED");
  });

  it("K2: tags must belong to the organization, and only once", async () => {
    const addTag = (tagId: string) =>
      as(alpha.contributor).post(`${task()}/tags`).send({ tagId });

    const foreign = await addTag(betaTagId);
    expect(foreign.status).toBe(400);
    expect(foreign.body.error.code).toBe("TAG_NOT_FOUND");

    expect((await addTag(alphaTagId)).status).toBe(201);
    const again = await addTag(alphaTagId);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("TAG_ALREADY_ADDED");
  });

  it("K3: assigned-to-me lists only my assignments and filters by status", async () => {
    const inProgress = await createTask("G2", "in_progress");
    const managers = await createTask("G3");
    await db.taskAssignee.createMany({
      data: [
        {
          organizationId: alpha.organization.id,
          taskId,
          userId: alpha.contributor.user.id,
        },
        {
          organizationId: alpha.organization.id,
          taskId: inProgress.id,
          userId: alpha.contributor.user.id,
        },
        {
          organizationId: alpha.organization.id,
          taskId: managers.id,
          userId: alpha.manager.user.id,
        },
      ],
    });
    const titles = (res: { body: { tasks: { title: string }[] } }) =>
      res.body.tasks.map((t) => t.title).sort();

    const mine = await as(alpha.contributor).get("/tasks/assigned-to-me");
    expect(titles(mine)).toEqual(["G1", "G2"]);

    const filtered = await as(alpha.contributor).get(
      "/tasks/assigned-to-me?status=in_progress",
    );
    expect(titles(filtered)).toEqual(["G2"]);

    const nothing = await as(alpha.outsider).get("/tasks/assigned-to-me");
    expect(nothing.body.tasks).toEqual([]);
  });

  it("K4: invalid input is rejected and nothing is written", async () => {
    const blankTitle = await as(alpha.contributor)
      .post(projectTasks())
      .send({ title: "   " });
    expect(blankTitle.status).toBe(400);
    expect(await db.task.count()).toBe(1);

    const emptyPatch = await as(alpha.contributor).patch(task()).send({});
    expect(emptyPatch.status).toBe(400);
  });

  it("K5: a task comes with its creator, assignees and tags, without password hashes", async () => {
    await as(alpha.manager)
      .post(`${task()}/assignees`)
      .send({ userId: alpha.contributor.user.id });
    await as(alpha.contributor)
      .post(`${task()}/tags`)
      .send({ tagId: alphaTagId });

    const res = await as(alpha.outsider).get(task());

    expect(res.body.task.createdBy.email).toBe(alpha.owner.user.email);
    expect(res.body.task.assignees[0].user.email).toBe(
      alpha.contributor.user.email,
    );
    expect(res.body.task.tags[0].tag.name).toBe("acil");
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });
  it("K6: the task list comes with creators, assignees and tags, without password hashes", async () => {
    await as(alpha.manager)
      .post(`${task()}/assignees`)
      .send({ userId: alpha.contributor.user.id });
    await as(alpha.contributor)
      .post(`${task()}/tags`)
      .send({ tagId: alphaTagId });

    const res = await as(alpha.outsider).get(projectTasks());

    expect(res.body.tasks[0].createdBy.email).toBe(alpha.owner.user.email);
    expect(res.body.tasks[0].assignees[0].user.email).toBe(
      alpha.contributor.user.email,
    );
    expect(res.body.tasks[0].tags[0].tag.name).toBe("acil");
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });
  it("K7: assigned-to-me comes with the project name, assignees and tags, without password hashes", async () => {
    await as(alpha.manager)
      .post(`${task()}/assignees`)
      .send({ userId: alpha.contributor.user.id });
    await as(alpha.contributor)
      .post(`${task()}/tags`)
      .send({ tagId: alphaTagId });

    const res = await as(alpha.contributor).get("/tasks/assigned-to-me");

    expect(res.body.tasks[0].project).toEqual({
      id: alpha.project.id,
      name: alpha.project.name,
    });
    expect(res.body.tasks[0].createdBy.email).toBe(alpha.owner.user.email);
    expect(res.body.tasks[0].assignees[0].user.email).toBe(
      alpha.contributor.user.email,
    );
    expect(res.body.tasks[0].tags[0].tag.name).toBe("acil");
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });
});
