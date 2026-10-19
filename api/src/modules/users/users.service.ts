import { z } from "zod";
import { db } from "../../shared/db.js";
import { hashPassword, userSelect } from "../auth/auth.service.js";
import { createUserSchema } from "./users.schema.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors.js";

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
