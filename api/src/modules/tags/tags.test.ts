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

const createTag = (org: TestOrganization, name: string, color?: string) =>
  db.tag.create({ data: { organizationId: org.organization.id, name, color } });

describe("GET /tags", () => {
  it("E1: lists only my organization's tags, sorted by name", async () => {
    await createTag(alpha, "urgent");
    await createTag(alpha, "backend");
    await createTag(beta, "beta-only");

    const res = await as(alpha.outsider).get("/tags");

    expect(res.status).toBe(200);
    expect(res.body.tags.map((t: { name: string }) => t.name)).toEqual(["backend", "urgent"]);
  });
});

describe("POST /tags", () => {
  it("E2: any member can create a tag; the color is stored in upper case", async () => {
    const res = await as(alpha.outsider).post("/tags").send({ name: "urgent", color: "#ff0000" });

    expect(res.status).toBe(201);
    expect(res.body.tag).toMatchObject({
      name: "urgent",
      color: "#FF0000",
      organizationId: alpha.organization.id,
    });
  });

  it("E3: rejects a name that already exists in the organization", async () => {
    await createTag(alpha, "urgent");

    const res = await as(alpha.contributor).post("/tags").send({ name: "urgent" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("TAG_NAME_TAKEN");
  });

  it("E4: the same name is allowed in another organization", async () => {
    await createTag(beta, "urgent");

    const res = await as(alpha.contributor).post("/tags").send({ name: "urgent" });

    expect(res.status).toBe(201);
  });

  it("E5: rejects an invalid color or an empty name", async () => {
    const invalid = [
      { name: "urgent", color: "red" },
      { name: "urgent", color: "#FFF" },
      { name: "   " },
    ];

    for (const body of invalid) {
      const res = await as(alpha.owner).post("/tags").send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
    expect(await db.tag.count()).toBe(0);
  });
});

describe("PATCH /tags/:id", () => {
  it("E6: renames a tag and removes its color with null", async () => {
    const tag = await createTag(alpha, "urgent", "#FF0000");

    const res = await as(alpha.outsider)
      .patch(`/tags/${tag.id}`)
      .send({ name: "critical", color: null });

    expect(res.status).toBe(200);
    expect(res.body.tag).toMatchObject({ name: "critical", color: null });
  });

  it("E7: rejects renaming to another tag's name", async () => {
    await createTag(alpha, "urgent");
    const backend = await createTag(alpha, "backend");

    const res = await as(alpha.owner).patch(`/tags/${backend.id}`).send({ name: "urgent" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("TAG_NAME_TAKEN");
  });
});

describe("DELETE /tags/:id", () => {
  it("E8: only the owner can delete", async () => {
    const tag = await createTag(alpha, "urgent");

    for (const actor of [alpha.manager, alpha.contributor, alpha.outsider]) {
      const res = await as(actor).delete(`/tags/${tag.id}`);
      expect(res.status, actor.user.email).toBe(403);
    }

    expect((await as(alpha.owner).delete(`/tags/${tag.id}`)).status).toBe(204);
    expect(await db.tag.count()).toBe(0);
  });

  it("E10: deleting a tag removes it from tasks", async () => {
    const tag = await createTag(alpha, "urgent");
    const task = await db.task.create({
      data: {
        organizationId: alpha.organization.id,
        projectId: alpha.project.id,
        title: "G1",
        createdById: alpha.owner.user.id,
      },
    });
    await db.taskTag.create({
      data: { organizationId: alpha.organization.id, taskId: task.id, tagId: tag.id },
    });

    await as(alpha.owner).delete(`/tags/${tag.id}`);

    const res = await as(alpha.owner).get(`/tasks/${task.id}`);
    expect(res.body.task.tags).toEqual([]);
  });
});

describe("tenant isolation", () => {
  it("E9: another organization cannot edit or delete my tag", async () => {
    const tag = await createTag(alpha, "urgent");

    const edit = await as(beta.owner).patch(`/tags/${tag.id}`).send({ name: "hacked" });
    const remove = await as(beta.owner).delete(`/tags/${tag.id}`);

    expect(edit.status).toBe(404);
    expect(remove.status).toBe(404);
    const stored = await db.tag.findUnique({ where: { id: tag.id } });
    expect(stored?.name).toBe("urgent");
  });
});
