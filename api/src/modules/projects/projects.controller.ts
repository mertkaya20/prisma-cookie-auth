import type { RequestHandler } from "express";
import { getAuthUser } from "../auth/auth.middleware.js";
import * as projectsService from "./projects.service.js";
import {
  addMemberSchema,
  createProjectSchema,
  memberParamsSchema,
  projectIdParamsSchema,
  updateMemberSchema,
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

export const listMembers: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id } = projectIdParamsSchema.parse(req.params);

  const members = await projectsService.listMembers(user, id);

  res.json({ members });
};

export const addMember: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id } = projectIdParamsSchema.parse(req.params);
  const { userId, role } = addMemberSchema.parse(req.body);

  const member = await projectsService.addMember(user, id, userId, role);

  res.status(201).json({ member });
};

export const updateMember: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id, userId } = memberParamsSchema.parse(req.params);
  const { role } = updateMemberSchema.parse(req.body);

  const member = await projectsService.updateMember(user, id, userId, role);

  res.json({ member });
};

export const removeMember: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id, userId } = memberParamsSchema.parse(req.params);

  await projectsService.removeMember(user, id, userId);

  res.status(204).end();
};
