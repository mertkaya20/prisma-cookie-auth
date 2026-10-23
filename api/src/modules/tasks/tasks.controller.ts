import type { RequestHandler } from "express";
import * as tasksService from "./tasks.service.js";
import { getAuthUser } from "../auth/auth.middleware.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  projectIdParamsSchema,
  taskIdParamsSchema,
  updateTaskSchema,
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

export const getTask: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id } = taskIdParamsSchema.parse(req.params);

  const task = await tasksService.getTask(user, id);

  res.json({ task });
};

export const updateTask: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id } = taskIdParamsSchema.parse(req.params);
  const parsedData = updateTaskSchema.parse(req.body);

  const task = await tasksService.updateTask(user, id, parsedData);

  res.json({ task });
};

export const deleteTask: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id } = taskIdParamsSchema.parse(req.params);

  await tasksService.deleteTask(user, id);

  res.status(204).end();
};
