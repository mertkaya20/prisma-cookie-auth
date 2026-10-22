import type { RequestHandler } from "express";
import { getAuthUser } from "../auth/auth.middleware.js";
import * as projectsService from "./projects.service.js";
import {
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectSchema,
} from "./projects.schema.js";

export const listProjects: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const projects = await projectsService.listProjects(organizationId);

  res.json({ projects });
};

export const getProject: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const { id } = projectIdParamsSchema.parse(req.params);

  const project = await projectsService.getProject(organizationId, id);

  res.json({ project });
};

export const createProject: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const parsedData = createProjectSchema.parse(req.body);

  const project = await projectsService.createProject(
    organizationId,
    parsedData,
  );

  res.status(201).json({ project });
};

export const updateProject: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const { id } = projectIdParamsSchema.parse(req.params);

  const parsedData = updateProjectSchema.parse(req.body);

  const project = await projectsService.updateProject(
    organizationId,
    id,
    parsedData,
  );

  res.json({ project });
};

export const deleteProject: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const { id } = projectIdParamsSchema.parse(req.params);

  await projectsService.deleteProject(organizationId, id);

  res.status(204).end();
};
