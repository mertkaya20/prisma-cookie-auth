import { z } from "zod";
import type { TaskStatus } from "../../generated/prisma/enums.js";
import { db } from "../../shared/db.js";
import { ForbiddenError, NotFoundError } from "../../shared/errors.js";
import type { SessionUser } from "../auth/auth.service.js";
import type { createTaskSchema, updateTaskSchema } from "./tasks.schema.js";

type CreateTaskInput = z.infer<typeof createTaskSchema>;

type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

const findProjectOrThrow = async (
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

const findEditableProjectOrThrow = async (
  user: SessionUser,
  projectId: string,
) => {
  const project = await findProjectOrThrow(user.organizationId, projectId);

  if (user.role === "owner") return project;

  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
  });
  if (!membership) throw new ForbiddenError();

  return project;
};

export const listTasks = async (
  user: SessionUser,
  projectId: string,
  status?: TaskStatus,
) => {
  await findProjectOrThrow(user.organizationId, projectId);

  return db.task.findMany({
    where: { organizationId: user.organizationId, projectId, status },
    orderBy: { createdAt: "desc" },
  });
};

export const createTask = async (
  user: SessionUser,
  projectId: string,
  input: CreateTaskInput,
) => {
  await findEditableProjectOrThrow(user, projectId);

  return db.task.create({
    data: {
      ...input,
      organizationId: user.organizationId,
      projectId,
      createdById: user.id,
    },
  });
};
