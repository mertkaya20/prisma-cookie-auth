import { Router } from "express";
import * as usersController from "./users.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", usersController.listUsers);

usersRouter.post("/", requireRole("owner"), usersController.createUser);
