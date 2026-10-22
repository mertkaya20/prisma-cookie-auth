import type { RequestHandler } from "express";
import * as tagsService from "./tags.service.js";
import { getAuthUser } from "../auth/auth.middleware.js";
import {
  createTagSchema,
  tagIdParamsSchema,
  updateTagSchema,
} from "./tags.schema.js";

export const listTags: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const tags = await tagsService.listTags(organizationId);

  res.json({ tags });
};

export const createTag: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const parsedData = createTagSchema.parse(req.body);

  const tag = await tagsService.createTag(organizationId, parsedData);

  res.status(201).json({ tag });
};

export const updateTag: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const { id } = tagIdParamsSchema.parse(req.params);

  const parsedData = updateTagSchema.parse(req.body);

  const tag = await tagsService.updateTag(organizationId, id, parsedData);

  res.json({ tag });
};

export const deleteTag: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const { id } = tagIdParamsSchema.parse(req.params);

  await tagsService.deleteTag(organizationId, id);

  res.status(204).end();
};
