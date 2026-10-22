import { Router } from "express";
import * as tagsController from "./tags.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

export const tagsRouter = Router();

tagsRouter.use(requireAuth);

tagsRouter.get("/", tagsController.listTags);
tagsRouter.post("/", tagsController.createTag);
tagsRouter.patch("/:id", tagsController.updateTag);
tagsRouter.delete("/:id", requireRole("owner"), tagsController.deleteTag);
