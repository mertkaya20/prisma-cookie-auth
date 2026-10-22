import { z } from "zod";
import { db } from "../../shared/db.js";
import { createTagSchema, updateTagSchema } from "./tags.schema.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError, NotFoundError } from "../../shared/errors.js";

type CreateTagInput = z.infer<typeof createTagSchema>;

type UpdateTagInput = z.infer<typeof updateTagSchema>;

export const listTags = async (organizationId: string) => {
  return await db.tag.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
};

export const createTag = async (
  organizationId: string,
  input: CreateTagInput,
) => {
  try {
    return await db.tag.create({
      data: {
        name: input.name,
        color: input.color,
        organizationId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "TAG_NAME_TAKEN", "Tag name already exists");
    }
    throw error;
  }
};

export const updateTag = async (
  organizationId: string,
  id: string,
  input: UpdateTagInput,
) => {
  try {
    return await db.tag.update({
      where: { organizationId_id: { organizationId, id } },
      data: input,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "TAG_NAME_TAKEN", "Tag name already exists");
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError();
    }
    throw error;
  }
};

export const deleteTag = async (organizationId: string, id: string) => {
  try {
    await db.tag.delete({
      where: { organizationId_id: { organizationId, id } },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError();
    }
    throw error;
  }
};
