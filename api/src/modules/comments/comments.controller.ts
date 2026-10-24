import type { RequestHandler } from "express";
import { getAuthUser } from "../auth/auth.middleware.js";
import {
  commentBodySchema,
  commentParamsSchema,
  taskIdParamsSchema,
} from "./comments.schema.js";
import * as commentsService from "./comments.service.js";

export const listComments: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { taskId } = taskIdParamsSchema.parse(req.params);

  const comments = await commentsService.listComments(user, taskId);

  res.json({ comments });
};

export const createComment: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { taskId } = taskIdParamsSchema.parse(req.params);
  const { body } = commentBodySchema.parse(req.body);

  const comment = await commentsService.createComment(user, taskId, body);

  res.status(201).json({ comment });
};

export const updateComment: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id } = commentParamsSchema.parse(req.params);
  const { body } = commentBodySchema.parse(req.body);

  const comment = await commentsService.updateComment(user, id, body);

  res.json({ comment });
};

export const deleteComment: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id } = commentParamsSchema.parse(req.params);

  await commentsService.deleteComment(user, id);

  res.status(204).end();
};
