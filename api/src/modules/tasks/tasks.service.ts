import { z } from "zod";

import { ProjectRole, type TaskStatus } from "../../generated/prisma/enums.js";
import { db } from "../../shared/db.js";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors.js";
import { userSelect, type SessionUser } from "../auth/auth.service.js";
import type { createTaskSchema, updateTaskSchema } from "./tasks.schema.js";
import { Prisma } from "../../generated/prisma/client.js";

type CreateTaskInput = z.infer<typeof createTaskSchema>;

type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

const EDIT_ROLES = [ProjectRole.manager, ProjectRole.contributor];
const MANAGE_ROLES = [ProjectRole.manager];

const taskInclude = {
  createdBy: { select: userSelect },
  assignees: { select: { user: { select: userSelect } } },
  tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
} satisfies Prisma.TaskInclude;

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

const findProjectWithAccessOrThrow = async (
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

const findTaskOrThrow = async (organizationId: string, id: string) => {
  const task = await db.task.findUnique({
    where: { organizationId_id: { organizationId, id } },
  });

  if (!task) throw new NotFoundError();
  return task;
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
  await findProjectWithAccessOrThrow(user, projectId, EDIT_ROLES);

  return db.task.create({
    data: {
      ...input,
      organizationId: user.organizationId,
      projectId,
      createdById: user.id,
    },
    include: taskInclude,
  });
};

export const getTask = async (user: SessionUser, id: string) => {
  const task = await db.task.findUnique({
    where: {
      organizationId_id: { organizationId: user.organizationId, id },
    },
    include: taskInclude,
  });

  if (!task) throw new NotFoundError();
  return task;
};

export const updateTask = async (
  user: SessionUser,
  id: string,
  input: UpdateTaskInput,
) => {
  const task = await findTaskOrThrow(user.organizationId, id);

  await findProjectWithAccessOrThrow(user, task.projectId, EDIT_ROLES);

  try {
    return await db.task.update({
      where: { organizationId_id: { organizationId: user.organizationId, id } },
      data: input,
      include: taskInclude,
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

export const deleteTask = async (user: SessionUser, id: string) => {
  const task = await findTaskOrThrow(user.organizationId, id);

  await findProjectWithAccessOrThrow(user, task.projectId, MANAGE_ROLES);

  try {
    return await db.task.delete({
      where: {
        organizationId_id: { organizationId: user.organizationId, id },
      },
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

export const addAssignee = async (
  user: SessionUser,
  id: string,
  assigneeId: string,
) => {
  /* 
  Akış--
  POST /tasks/:id/assignees istek geldi.
  requireAuth kullanıldı kullanıcı authenticate olmuş mu kontrol edildi.
  Sonrasında yolunu buldu tasks/:id/assignees controllera düştü sonrasında controller service e yönlendirdi. 
  Fonksiyon Görevi--
  1-) Kullanıcının organizasyonunun böyle bir görevi var mı ? Kontrol hata mesajları.
  2-) Auth olmuş kullanıcının bu fonksiyonun işlevini yapmaya rolü yetiyor mu ? Kontrol hata mesajları.
  3-) Eğer yetiyorsa auth olmuş kullanıcının eklemeye çalıştığı kişi projectMember mı ? Değilse ekleyemez.
  4-) ProjectMember ise db.taskAssignee.create taskId userId ve organizationId verilir
  5-) Sonrasında getTask fonksiyonu çalıştırılır ve sonuç döndürülür. 
  */

  const task = await findTaskOrThrow(user.organizationId, id);

  const project = await findProjectWithAccessOrThrow(
    user,
    task.projectId,
    MANAGE_ROLES,
  );

  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: assigneeId } },
  });

  if (!member) {
    throw new AppError(
      400,
      "ASSIGNEE_NOT_IN_PROJECT",
      "User is not a member of this project",
    );
  }

  try {
    await db.taskAssignee.create({
      data: {
        organizationId: user.organizationId,
        userId: member.userId,
        taskId: task.id,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "ALREADY_ASSIGNED",
        "User is already assigned to this task",
      );
    }
    throw error;
  }

  return getTask(user, id);
};

export const removeAssignee = async (
  user: SessionUser,
  id: string,
  assigneeId: string,
) => {
  const task = await findTaskOrThrow(user.organizationId, id);

  await findProjectWithAccessOrThrow(user, task.projectId, MANAGE_ROLES);

  try {
    await db.taskAssignee.delete({
      where: { taskId_userId: { taskId: task.id, userId: assigneeId } },
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
