import { Router } from "express";
import * as usersController from "./users.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", usersController.listUsers);

usersRouter.post("/", requireRole("owner"), usersController.createUser);

usersRouter.post(
  "/:id/deactivate",
  requireRole("owner"),
  usersController.deactivateUser,
);

usersRouter.post(
  "/:id/activate",
  requireRole("owner"),
  usersController.activateUser,
);
