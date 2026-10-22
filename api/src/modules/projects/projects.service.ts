import { z } from "zod";
import { db } from "../../shared/db.js";
import { AppError, NotFoundError } from "../../shared/errors.js";
import { createProjectSchema, updateProjectSchema } from "./projects.schema.js";
import { Prisma } from "../../generated/prisma/client.js";

type CreateProjectInput = z.infer<typeof createProjectSchema>;

type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const listProjects = async (organizationId: string) => {
  return db.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
};

export const getProject = async (organizationId: string, id: string) => {
  const project = await db.project.findUnique({
    where: { organizationId_id: { organizationId, id } },
  });

  if (!project) {
    throw new NotFoundError();
  }

  return project;
};

export const createProject = async (
  organizationId: string,
  input: CreateProjectInput,
) => {
  try {
    const createdProject = await db.project.create({
      data: {
        name: input.name,
        description: input.description,
        organizationId,
      },
    });
    return createdProject;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "PROJECT_NAME_TAKEN",
        "A project with this name already exists",
      );
    }
    throw error;
  }
};

export const updateProject = async (
  organizationId: string,
  id: string,
  input: UpdateProjectInput,
) => {
  try {
    const updatedProject = await db.project.update({
      where: { organizationId_id: { organizationId, id } },
      data: input,
    });
    return updatedProject;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "PROJECT_NAME_TAKEN",
        "A project with this name already exists",
      );
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

export const deleteProject = async (organizationId: string, id: string) => {
  try {
    await db.project.delete({
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
