import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import * as projectsController from "./projects.controller.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", projectsController.listProjects);

projectsRouter.get("/:id", projectsController.getProject);

projectsRouter.post(
  "/",
  requireRole("owner"),
  projectsController.createProject,
);

projectsRouter.patch(
  "/:id",
  requireRole("owner"),
  projectsController.updateProject,
);

projectsRouter.delete(
  "/:id",
  requireRole("owner"),
  projectsController.deleteProject,
);
