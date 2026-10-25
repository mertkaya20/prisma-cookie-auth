import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../server.js";
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
