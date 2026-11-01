import request from "supertest";
import type { Role } from "../../generated/prisma/enums.js";
import {
  createSession,
  hashPassword,
  userSelect,
} from "../../modules/auth/auth.service.js";
import { SESSION_COOKIE } from "../../modules/auth/auth.middleware.js";
import { server } from "../../server.js";
import { db } from "../db.js";

export const PASSWORD = "password123";

// bcrypt yavaş; hash test dosyası başına bir kez hesaplanır.
let passwordHash: Promise<string> | undefined;
const getPasswordHash = () => (passwordHash ??= hashPassword(PASSWORD));

export type Actor = Awaited<ReturnType<typeof createActor>>;

export const sessionCookie = (res: request.Response) => {
  const cookie = res.get("Set-Cookie")?.[0];
  if (!cookie) throw new Error("session cookie not set");
  return cookie.split(";")[0]!;
};

// Kullanıcıyı ve oturumunu veritabanına doğrudan yazar; login'den geçmez.
const createActor = async (
  organizationId: string,
  email: string,
  role: Role,
) => {
  const user = await db.user.create({
    data: {
      organizationId,
      email,
      name: email.split("@")[0]!,
      role,
      passwordHash: await getPasswordHash(),
    },
    select: userSelect,
  });
  const token = await createSession(user.id);

  return { user, cookie: `${SESSION_COOKIE}=${token}` };
};

/**
 * Bir şirket kurar: owner, projede manager, projede contributor,
 * projede olmayan bir member ve bir proje.
 */
export const createOrganization = async (slug: string) => {
  const organization = await db.organization.create({ data: { name: slug } });
  const organizationId = organization.id;

  const owner = await createActor(
    organizationId,
    `owner@${slug}.test`,
    "owner",
  );
  const manager = await createActor(
    organizationId,
    `manager@${slug}.test`,
    "member",
  );
  const contributor = await createActor(
    organizationId,
    `contributor@${slug}.test`,
    "member",
  );
  const outsider = await createActor(
    organizationId,
    `outsider@${slug}.test`,
    "member",
  );

  const project = await db.project.create({
    data: { organizationId, name: "Web" },
  });
  await db.projectMember.createMany({
    data: [
      {
        organizationId,
        projectId: project.id,
        userId: manager.user.id,
        role: "manager",
      },
      {
        organizationId,
        projectId: project.id,
        userId: contributor.user.id,
        role: "contributor",
      },
    ],
  });

  return { organization, project, owner, manager, contributor, outsider };
};

export type TestOrganization = Awaited<ReturnType<typeof createOrganization>>;

// as(alpha.contributor).post("/...") → o kullanıcının cookie'siyle istek.
export const as = (actor: Actor) => ({
  get: (url: string) => request(server).get(url).set("Cookie", actor.cookie),
  post: (url: string) => request(server).post(url).set("Cookie", actor.cookie),
  patch: (url: string) =>
    request(server).patch(url).set("Cookie", actor.cookie),
  delete: (url: string) =>
    request(server).delete(url).set("Cookie", actor.cookie),
});
