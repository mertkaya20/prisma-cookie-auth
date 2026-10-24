import { z } from "zod";
import { db } from "../../shared/db.js";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors.js";
import { createProjectSchema, updateProjectSchema } from "./projects.schema.js";
import { Prisma, ProjectRole } from "../../generated/prisma/client.js";
import { userSelect, type SessionUser } from "../auth/auth.service.js";

type CreateProjectInput = z.infer<typeof createProjectSchema>;

type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const EDIT_ROLES = [ProjectRole.manager, ProjectRole.contributor];
export const MANAGE_ROLES = [ProjectRole.manager];

const memberInclude = {
  user: { select: userSelect },
} satisfies Prisma.ProjectMemberInclude;

export const findProjectOrThrow = async (
  organizationId: string,
  projectId: string,
) => {
  const project = await db.project.findUnique({
    where: { organizationId_id: { organizationId, id: projectId } },
  });
  if (!project) {
    throw new NotFoundError();
  }
  return project;
};

export const findProjectWithAccessOrThrow = async (
  user: SessionUser,
  projectId: string,
  allowedRoles: ProjectRole[],
) => {
  const project = await findProjectOrThrow(user.organizationId, projectId);

  if (user.role === "owner") return project;

  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
  });
  if (!membership || !allowedRoles.includes(membership.role))
    throw new ForbiddenError();

  return project;
};

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

export const listMembers = async (user: SessionUser, projectId: string) => {
  await findProjectOrThrow(user.organizationId, projectId);

  return db.projectMember.findMany({
    where: { projectId, organizationId: user.organizationId },
    include: memberInclude,
    orderBy: { user: { name: "asc" } },
  });
};

export const addMember = async (
  user: SessionUser,
  projectId: string,
  memberId: string,
  role?: ProjectRole,
) => {
  await findProjectWithAccessOrThrow(user, projectId, MANAGE_ROLES);

  const targetUser = await db.user.findUnique({
    where: {
      organizationId_id: { organizationId: user.organizationId, id: memberId },
    },
  });

  if (!targetUser) {
    throw new AppError(400, "USER_NOT_FOUND", "User not found");
  }

  try {
    return await db.projectMember.create({
      data: {
        organizationId: user.organizationId,
        projectId,
        userId: memberId,
        role,
      },
      include: memberInclude,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "USER_ALREADY_PROJECT_MEMBER",
        "User is already a member of project",
      );
    }
    throw error;
  }
};

export const updateMember = async (
  user: SessionUser,
  projectId: string,
  memberId: string,
  role: ProjectRole,
) => {
  await findProjectWithAccessOrThrow(user, projectId, MANAGE_ROLES);

  try {
    return await db.projectMember.update({
      where: { projectId_userId: { projectId, userId: memberId } },
      data: { role },
      include: memberInclude,
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

export const removeMember = async (
  user: SessionUser,
  projectId: string,
  memberId: string,
) => {
  await findProjectWithAccessOrThrow(user, projectId, MANAGE_ROLES);

  try {
    await db.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberId } },
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
