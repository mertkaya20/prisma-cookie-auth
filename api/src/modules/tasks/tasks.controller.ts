import type { RequestHandler } from "express";
import * as tasksService from "./tasks.service.js";
import { getAuthUser } from "../auth/auth.middleware.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  projectIdParamsSchema,
} from "./tasks.schema.js";

export const listTasks: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { projectId } = projectIdParamsSchema.parse(req.params);
  const { status } = listTasksQuerySchema.parse(req.query);

  const tasks = await tasksService.listTasks(user, projectId, status);

  res.json({ tasks });
};

export const createTask: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { projectId } = projectIdParamsSchema.parse(req.params);
  const parsedData = createTaskSchema.parse(req.body);

  const task = await tasksService.createTask(user, projectId, parsedData);

  res.status(201).json({ task });
};
