import bcrypt from "bcryptjs";
import { db } from "../../shared/db.js";
import { registerSchema } from "./auth.schema.js";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors.js";

type RegisterInput = z.infer<typeof registerSchema>;
const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  organizationId: true,
} as const;
const BCRYPT_COST = 12;

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
