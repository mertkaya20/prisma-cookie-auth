import { Prisma } from "../../generated/prisma/client.js";
import { db } from "../../shared/db.js";
import { ForbiddenError, NotFoundError } from "../../shared/errors.js";
import { type SessionUser, userSelect } from "../auth/auth.service.js";
import {
  EDIT_ROLES,
  findProjectWithAccessOrThrow,
  MANAGE_ROLES,
} from "../projects/projects.service.js";
import { findTaskOrThrow } from "../tasks/tasks.service.js";

const commentInclude = {
  author: { select: userSelect },
} satisfies Prisma.CommentInclude;

const findCommentOrThrow = async (organizationId: string, id: string) => {
  const comment = await db.comment.findUnique({
    where: { organizationId, id },
  });
  if (!comment) throw new NotFoundError();
  return comment;
};

export const listComments = async (user: SessionUser, taskId: string) => {
  await findTaskOrThrow(user.organizationId, taskId);

  return db.comment.findMany({
    where: { organizationId: user.organizationId, taskId },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });
};

export const createComment = async (
  user: SessionUser,
  taskId: string,
  body: string,
) => {
  const task = await findTaskOrThrow(user.organizationId, taskId);

  await findProjectWithAccessOrThrow(user, task.projectId, EDIT_ROLES);

  return db.comment.create({
    data: {
      organizationId: user.organizationId,
      taskId,
      authorId: user.id,
      body,
    },
    include: commentInclude,
  });
};

export const updateComment = async (
  user: SessionUser,
  id: string,
  body: string,
) => {
  const comment = await findCommentOrThrow(user.organizationId, id);

  if (comment.authorId !== user.id) throw new ForbiddenError();

  try {
    return await db.comment.update({
      where: { organizationId: user.organizationId, id },
      data: { body },
      include: commentInclude,
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

export const deleteComment = async (user: SessionUser, id: string) => {
  const comment = await findCommentOrThrow(user.organizationId, id);

  if (comment.authorId !== user.id) {
    const task = await findTaskOrThrow(user.organizationId, comment.taskId);

    await findProjectWithAccessOrThrow(user, task.projectId, MANAGE_ROLES);
  }

  try {
    await db.comment.delete({
      where: { organizationId: user.organizationId, id },
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
