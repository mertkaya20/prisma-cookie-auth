import bcrypt from "bcryptjs";
import { db } from "../../shared/db.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors.js";
import { createHash, randomBytes } from "node:crypto";
import { Return } from "@prisma/client/runtime/client";

type RegisterInput = z.infer<typeof registerSchema>;

type LoginInput = z.infer<typeof loginSchema>;

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  organizationId: true,
} as const;

const BCRYPT_COST = 12;
const DUMMY_HASH =
  "$2b$12$LQSavXPKB8QsRlH3Wkaiwe8glnqB37iqSFLluRfz3vXZqoY4VD9la";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const register = async (input: RegisterInput) => {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  try {
    const user = await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: "owner",
        passwordHash,
        organization: {
          create: {
            name: input.organizationName,
          },
        },
      },
      select: userSelect,
    });
    return user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "EMAIL_TAKEN", "Email is already registered");
    }
    throw error;
  }
};

export const login = async (input: LoginInput) => {
  const user = await db.user.findUnique({
    where: { email: input.email },
    select: {
      ...userSelect,
      passwordHash: true,
      organization: { select: { status: true } },
    },
  });

  const valid = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (user.organization.status === "suspended") {
    throw new AppError(
      403,
      "ORGANIZATION_SUSPENDED",
      "Organization is suspended",
    );
  }

  const token = randomBytes(32).toString("base64url");

  await db.session.create({
    data: {
      id: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    },
  };
};

export const getSessionUser = async (token: string) => {
  const hashedToken = hashToken(token);

  const session = await db.session.findUnique({
    where: { id: hashedToken },
    include: {
      user: {
        select: {
          ...userSelect,
          organization: { select: { status: true } },
        },
      },
    },
  });
  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  if (session.user.organization.status === "suspended") return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    organizationId: session.user.organizationId,
  };
};

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getSessionUser>>
>;
