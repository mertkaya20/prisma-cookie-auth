import bcrypt from "bcryptjs";
import { db } from "../../shared/db.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "./auth.schema.js";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError, UnauthorizedError } from "../../shared/errors.js";
import { createHash, randomBytes } from "node:crypto";

type RegisterInput = z.infer<typeof registerSchema>;

type LoginInput = z.infer<typeof loginSchema>;

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  organizationId: true,
  deactivatedAt: true,
} as const;

const BCRYPT_COST = 12;

export const hashPassword = (password: string) =>
  bcrypt.hash(password, BCRYPT_COST);

const DUMMY_HASH =
  "$2b$12$LQSavXPKB8QsRlH3Wkaiwe8glnqB37iqSFLluRfz3vXZqoY4VD9la";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type PublicUserFields = Prisma.UserGetPayload<{ select: typeof userSelect }>;

const toPublicUser = (user: PublicUserFields) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  organizationId: user.organizationId,
  deactivatedAt: user.deactivatedAt,
});

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

// Token'ın kendisi cookie'ye gider, veritabanına sadece hash'i yazılır.
export const createSession = async (userId: string) => {
  const token = randomBytes(32).toString("base64url");

  await db.session.create({
    data: {
      id: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return token;
};

export const register = async (input: RegisterInput) => {
  const passwordHash = await hashPassword(input.password);

  let user;
  try {
    user = await db.user.create({
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
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "EMAIL_TAKEN", "Email is already registered");
    }
    throw error;
  }

  // Kayıt olan kullanıcı ayrıca login olmadan giriş yapmış sayılır.
  const token = await createSession(user.id);

  return { token, user };
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

  if (user.deactivatedAt) {
    throw new AppError(403, "USER_DEACTIVATED", "This account is deactivated");
  }

  const token = await createSession(user.id);

  return {
    token,
    user: toPublicUser(user),
  };
};

export const logout = async (token: string) => {
  const hashedToken = hashToken(token);

  await db.session.deleteMany({
    where: { id: hashedToken },
  });

  return;
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

  if (session.user.deactivatedAt) return null;

  return toPublicUser(session.user);
};

export const changePassword = async (
  userId: string,
  input: ChangePasswordInput,
) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) throw new UnauthorizedError();

  const isMatch = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );

  if (!isMatch) {
    throw new AppError(
      400,
      "INVALID_CURRENT_PASSWORD",
      "Current password is wrong",
    );
  }

  const isSame = input.currentPassword === input.newPassword;

  if (isSame) {
    throw new AppError(
      400,
      "SAME_PASSWORD",
      "New password must be different from the current one",
    );
  }

  const passwordHash = await hashPassword(input.newPassword);

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),

    db.session.deleteMany({ where: { userId } }),
  ]);

  return await createSession(userId);
};

export type SessionUser = ReturnType<typeof toPublicUser>;
