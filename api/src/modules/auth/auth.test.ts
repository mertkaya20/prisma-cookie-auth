import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { server } from "../../server.js";
import { db } from "../../shared/db.js";

describe("POST /auth/register", () => {
  const input = {
    name: "test",
    email: "test@mail.com",
    password: "test1234",
    organizationName: "TEST ORG",
  };
  it("creates an organization and logs the owner in", async () => {
    const res = await request(server).post("/auth/register").send(input);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: input.email,
      name: input.name,
      role: "owner",
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    const cookie = res.get("Set-Cookie")?.[0];
    expect(cookie).toMatch(/^taskapp_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Secure/);
  });
  it("rejects an email that is already registered", async () => {
    await request(server).post("/auth/register").send(input);

    const res = await request(server).post("/auth/register").send(input);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
    expect(res.body.error.message).toBeDefined();
    expect(await db.organization.count()).toBe(1);
  });
  it("rejects with invalid body", async () => {
    const res = await request(server)
      .post("/auth/register")
      .send({ ...input, password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBeDefined();
    expect(await db.organization.count()).toBe(0);
  });
});

describe("POST /auth/login", () => {
  const registerInput = {
    name: "test",
    email: "test@mail.com",
    password: "test1234",
    organizationName: "TEST ORG",
  };
  const loginInput = {
    email: registerInput.email,
    password: registerInput.password,
  };

  const login = (body: object) =>
    request(server).post("/auth/login").send(body);

  // Her login testi kayıtlı bir kullanıcıyla başlar; register 1 session oluşturur.
  beforeEach(async () => {
    await request(server).post("/auth/register").send(registerInput);
  });

  it("logs in", async () => {
    const res = await login(loginInput);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: loginInput.email,
      name: registerInput.name,
      role: "owner",
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    const cookie = res.get("Set-Cookie")?.[0];
    expect(cookie).toMatch(/^taskapp_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Secure/);
  });

  it("rejects a wrong password without creating a session", async () => {
    const res = await login({ ...loginInput, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(res.get("Set-Cookie")).toBeUndefined();
    expect(await db.session.count()).toBe(1);
  });

  it("gives the same answer for an unknown email as for a wrong password", async () => {
    const wrongPassword = await login({
      ...loginInput,
      password: "wrong-password",
    });
    const unknownEmail = await login({
      ...loginInput,
      email: "nobody@mail.com",
    });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it("accepts the email in a different case", async () => {
    const res = await login({ ...loginInput, email: "TEST@Mail.com" });

    expect(res.status).toBe(200);
  });

  it("rejects a suspended organization even with the right password", async () => {
    await db.organization.updateMany({ data: { status: "suspended" } });

    const res = await login(loginInput);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ORGANIZATION_SUSPENDED");
    expect(await db.session.count()).toBe(1);
  });

  it("rejects an invalid body", async () => {
    const res = await login({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

const owner = {
  name: "test",
  email: "test@mail.com",
  password: "test1234",
  organizationName: "TEST ORG",
};

// "taskapp_session=<token>; Path=/; HttpOnly; ..." → "taskapp_session=<token>"
const sessionCookie = (res: request.Response) => {
  const cookie = res.get("Set-Cookie")?.[0];
  if (!cookie) throw new Error("session cookie not set");
  return cookie.split(";")[0]!;
};

const me = (cookie?: string) => {
  const req = request(server).get("/auth/me");
  return cookie ? req.set("Cookie", cookie) : req;
};

describe("GET /auth/me", () => {
  let cookie: string;

  beforeEach(async () => {
    cookie = sessionCookie(
      await request(server).post("/auth/register").send(owner),
    );
  });

  it("returns the logged-in user and is not cached", async () => {
    const res = await me(cookie);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: owner.email, role: "owner" });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.get("Cache-Control")).toBe("no-store");
  });

  it("rejects a request without a cookie", async () => {
    const res = await me();

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a made-up token", async () => {
    const res = await me("taskapp_session=made-up-token");

    expect(res.status).toBe(401);
  });

  it("rejects an expired session and deletes it", async () => {
    await db.session.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await me(cookie);

    expect(res.status).toBe(401);
    expect(await db.session.count()).toBe(0);
  });

  it("rejects a session whose organization is suspended", async () => {
    await db.organization.updateMany({ data: { status: "suspended" } });

    const res = await me(cookie);

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  const logout = (cookie?: string) => {
    const req = request(server).post("/auth/logout");
    return cookie ? req.set("Cookie", cookie) : req;
  };

  it("deletes the session and clears the cookie", async () => {
    const cookie = sessionCookie(
      await request(server).post("/auth/register").send(owner),
    );

    const res = await logout(cookie);

    expect(res.status).toBe(204);
    expect(res.get("Set-Cookie")?.[0]).toMatch(/^taskapp_session=;/);
    expect(await db.session.count()).toBe(0);
    expect((await me(cookie)).status).toBe(401);
  });

  it("succeeds without a cookie", async () => {
    const res = await logout();

    expect(res.status).toBe(204);
  });

  it("only ends the session it was called with", async () => {
    await request(server).post("/auth/register").send(owner);
    const login = () =>
      request(server)
        .post("/auth/login")
        .send({ email: owner.email, password: owner.password });
    const laptop = sessionCookie(await login());
    const phone = sessionCookie(await login());

    await logout(laptop);

    expect((await me(laptop)).status).toBe(401);
    expect((await me(phone)).status).toBe(200);
  });
});

describe("POST /auth/password", () => {
  let cookie: string;
  const newPassword = "new-password-123";

  beforeEach(async () => {
    cookie = sessionCookie(
      await request(server).post("/auth/register").send(owner),
    );
  });

  const changePassword = (cookie: string | undefined, body: object) => {
    const req = request(server).post("/auth/password").send(body);
    return cookie ? req.set("Cookie", cookie) : req;
  };

  const loginWith = (password: string) =>
    request(server).post("/auth/login").send({ email: owner.email, password });

  it("S1: changes the password and keeps me logged in with a new session", async () => {
    const res = await changePassword(cookie, {
      currentPassword: owner.password,
      newPassword,
    });

    expect(res.status).toBe(204);
    const newCookie = sessionCookie(res);
    expect((await me(newCookie)).status).toBe(200);

    expect((await loginWith(owner.password)).status).toBe(401);
    expect((await loginWith(newPassword)).status).toBe(200);
  });

  it("S2: rejects a wrong current password and keeps the old one", async () => {
    const res = await changePassword(cookie, {
      currentPassword: "wrong-password",
      newPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_CURRENT_PASSWORD");
    expect(res.get("Set-Cookie")).toBeUndefined();
    expect((await me(cookie)).status).toBe(200);
    expect((await loginWith(owner.password)).status).toBe(200);
  });

  it("S3: rejects a short new password", async () => {
    const res = await changePassword(cookie, {
      currentPassword: owner.password,
      newPassword: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.get("Set-Cookie")).toBeUndefined();
    expect((await me(cookie)).status).toBe(200);
    expect((await loginWith(owner.password)).status).toBe(200);
  });

  it("S4: rejects a request without a cookie", async () => {
    const res = await changePassword(undefined, {
      currentPassword: owner.password,
      newPassword,
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.get("Set-Cookie")).toBeUndefined();
    expect((await me(cookie)).status).toBe(200);
    expect((await loginWith(owner.password)).status).toBe(200);
  });

  it("S5: ends every other session and gives this device a new one", async () => {
    const laptop = cookie;
    const phone = sessionCookie(await loginWith(owner.password));

    const res = await changePassword(laptop, {
      currentPassword: owner.password,
      newPassword,
    });
    expect(res.status).toBe(204);
    expect((await me(laptop)).status).toBe(401);
    expect((await me(phone)).status).toBe(401);
    expect((await me(sessionCookie(res))).status).toBe(200);
  });

  it("S6: rejects a new password that is the same as the current one", async () => {
    const res = await changePassword(cookie, {
      currentPassword: owner.password,
      newPassword: owner.password,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SAME_PASSWORD");
    expect(res.get("Set-Cookie")).toBeUndefined();
    expect((await me(cookie)).status).toBe(200);
    expect((await loginWith(owner.password)).status).toBe(200);
  });
});
