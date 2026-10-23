import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import * as tasksController from "./tasks.controller.js";

export const projectTasksRouter = Router({ mergeParams: true });
projectTasksRouter.use(requireAuth);
projectTasksRouter.get("/", tasksController.listTasks);
projectTasksRouter.post("/", tasksController.createTask);

export const tasksRouter = Router();
tasksRouter.use(requireAuth);
tasksRouter.get("/:id", tasksController.getTask);
tasksRouter.patch("/:id", tasksController.updateTask);
tasksRouter.delete("/:id", tasksController.deleteTask);
tasksRouter.post("/:id/assignees", tasksController.addAssignee);
tasksRouter.delete("/:id/assignees/:userId", tasksController.removeAssignee);
