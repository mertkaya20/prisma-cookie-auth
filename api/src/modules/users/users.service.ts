import { z } from "zod";
import { db } from "../../shared/db.js";
import {
  hashPassword,
  type SessionUser,
  userSelect,
} from "../auth/auth.service.js";
import { createUserSchema } from "./users.schema.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError, NotFoundError } from "../../shared/errors.js";

type CreateUserInput = z.infer<typeof createUserSchema>;

export const listUsers = async (organizationId: string) => {
  const users = await db.user.findMany({
    where: { organizationId },
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });
  return users;
};

export const createUser = async (
  organizationId: string,
  input: CreateUserInput,
) => {
  const passwordHash = await hashPassword(input.password);

  let user;
  try {
    user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        organizationId,
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

  return user;
};

const findUserOrThrow = async (organizationId: string, id: string) => {
  const user = await db.user.findUnique({
    where: { organizationId_id: { organizationId, id } },
    select: userSelect,
  });

  if (!user) throw new NotFoundError();
  return user;
};

export const deactivateUser = async (actor: SessionUser, id: string) => {
  const user = await findUserOrThrow(actor.organizationId, id);

  // Bir owner'ı sadece başka bir owner kapatabildiği için en az bir etkin owner kalır.
  if (user.id === actor.id) {
    throw new AppError(
      400,
      "CANNOT_DEACTIVATE_SELF",
      "You can't deactivate yourself",
    );
  }

  // Zaten devre dışıysa dokunma: ilk tarih (ne zaman ayrıldı) korunur.
  if (user.deactivatedAt) return user;

  const [updated] = await db.$transaction([
    db.user.update({
      where: { id },
      data: { deactivatedAt: new Date() },
      select: userSelect,
    }),
    db.session.deleteMany({ where: { userId: id } }),
  ]);

  return updated;
};

// Oturum açmaz: kişi yeniden giriş yapar.
export const activateUser = async (organizationId: string, id: string) => {
  const user = await findUserOrThrow(organizationId, id);

  if (!user.deactivatedAt) return user;

  return db.user.update({
    where: { id },
    data: { deactivatedAt: null },
    select: userSelect,
  });
};
