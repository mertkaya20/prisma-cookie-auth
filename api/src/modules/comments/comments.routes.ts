import { Router } from "express";
import * as commentsController from "./comments.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

export const taskCommentsRouter = Router({ mergeParams: true });
taskCommentsRouter.use(requireAuth);
taskCommentsRouter.get("/", commentsController.listComments);

taskCommentsRouter.post("/", commentsController.createComment);

export const commentsRouter = Router();
commentsRouter.use(requireAuth);
commentsRouter.patch("/:id", commentsController.updateComment);

commentsRouter.delete("/:id", commentsController.deleteComment);
