import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../shared/db.js";
import {
  as,
  createOrganization,
  type Actor,
  type TestOrganization,
} from "../../shared/test/fixtures.js";

let alpha: TestOrganization;
let beta: TestOrganization;
let taskId: string;

// Alpha'nın projesinde bir görev; yorumlar bu görevin altında.
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
});

const taskComments = (id = taskId) => `/tasks/${id}/comments`;
const comment = (id: string) => `/comments/${id}`;

// Sıra testleri için createdAt açıkça verilir; aynı milisaniyeye düşmesinler.
const createComment = (author: Actor, body: string, minutesAgo = 0) =>
  db.comment.create({
    data: {
      organizationId: alpha.organization.id,
      taskId,
      authorId: author.user.id,
      body,
      createdAt: new Date(Date.now() - minutesAgo * 60_000),
    },
  });

describe("reading comments", () => {
  it("C1: anyone in the organization can read them, oldest first, with the author", async () => {
    await createComment(alpha.manager, "second", 1);
    await createComment(alpha.contributor, "first", 2);

    const res = await as(alpha.outsider).get(taskComments());

    expect(res.status).toBe(200);
    const thread = res.body.comments.map(
      (c: { body: string; author: { name: string } }) => `${c.author.name}: ${c.body}`,
    );
    expect(thread).toEqual(["contributor: first", "manager: second"]);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("C2: a missing task or another organization's task is 404, not an empty list", async () => {
    const missing = await as(alpha.owner).get(
      taskComments("0193aaaa-0000-7000-8000-000000000000"),
    );
    expect(missing.status).toBe(404);

    const foreign = await as(beta.owner).get(taskComments());
    expect(foreign.status).toBe(404);
  });
});

describe("writing comments", () => {
  it("C3: the owner and the project team can comment, others cannot", async () => {
    for (const actor of [alpha.owner, alpha.manager, alpha.contributor]) {
      const res = await as(actor).post(taskComments()).send({ body: "hello" });
      expect(res.status, actor.user.email).toBe(201);
    }

    const res = await as(alpha.outsider).post(taskComments()).send({ body: "hello" });
    expect(res.status).toBe(403);
  });

  it("C4: the author is always the logged-in user", async () => {
    const res = await as(alpha.contributor)
      .post(taskComments())
      .send({ body: "  hello  ", authorId: alpha.owner.user.id });

    expect(res.status).toBe(201);
    expect(res.body.comment.author.email).toBe(alpha.contributor.user.email);
    expect(res.body.comment.body).toBe("hello");
  });

  it("C5: rejects an empty or too long comment", async () => {
    for (const body of ["   ", "a".repeat(2001)]) {
      const res = await as(alpha.contributor).post(taskComments()).send({ body });
      expect(res.status, `${body.length} chars`).toBe(400);
    }
    expect(await db.comment.count()).toBe(0);
  });
});

describe("editing and deleting comments", () => {
  it("C6: only the author can edit, not even the manager or the owner", async () => {
    const own = await createComment(alpha.contributor, "original");

    for (const actor of [alpha.manager, alpha.owner]) {
      const res = await as(actor).patch(comment(own.id)).send({ body: "changed" });
      expect(res.status, actor.user.email).toBe(403);
    }

    const res = await as(alpha.contributor).patch(comment(own.id)).send({ body: "fixed" });
    expect(res.status).toBe(200);
    expect(res.body.comment.body).toBe("fixed");
  });

  it("C7: the author, the project manager and the owner can delete; others cannot", async () => {
    const managers = await createComment(alpha.manager, "by manager");
    expect((await as(alpha.contributor).delete(comment(managers.id))).status).toBe(403);
    expect((await as(alpha.outsider).delete(comment(managers.id))).status).toBe(403);

    const own = await createComment(alpha.contributor, "mine");
    expect((await as(alpha.contributor).delete(comment(own.id))).status).toBe(204);

    const moderated = await createComment(alpha.contributor, "rude");
    expect((await as(alpha.manager).delete(comment(moderated.id))).status).toBe(204);

    const byOwner = await createComment(alpha.contributor, "rude again");
    expect((await as(alpha.owner).delete(comment(byOwner.id))).status).toBe(204);

    expect(await db.comment.count()).toBe(1);
  });

  it("C9: a member removed from the team can still edit their old comment but cannot write new ones", async () => {
    const old = await createComment(alpha.contributor, "before");
    await db.projectMember.delete({
      where: {
        projectId_userId: { projectId: alpha.project.id, userId: alpha.contributor.user.id },
      },
    });

    const edit = await as(alpha.contributor).patch(comment(old.id)).send({ body: "after" });
    expect(edit.status).toBe(200);

    const write = await as(alpha.contributor).post(taskComments()).send({ body: "new" });
    expect(write.status).toBe(403);
  });
});

describe("tenant isolation", () => {
  it("C8: another organization cannot edit or delete my comments", async () => {
    const own = await createComment(alpha.contributor, "original");

    expect((await as(beta.owner).patch(comment(own.id)).send({ body: "hacked" })).status).toBe(404);
    expect((await as(beta.owner).delete(comment(own.id))).status).toBe(404);

    const stored = await db.comment.findUnique({ where: { id: own.id } });
    expect(stored?.body).toBe("original");
  });
});
