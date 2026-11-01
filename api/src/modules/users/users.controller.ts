import type { RequestHandler } from "express";
import * as usersService from "./users.service.js";
import { getAuthUser } from "../auth/auth.middleware.js";
import { createUserSchema, userIdParamsSchema } from "./users.schema.js";

export const listUsers: RequestHandler = async (req, res) => {
  const { organizationId } = getAuthUser(req);

  const users = await usersService.listUsers(organizationId);

  res.json({ users });
};

export const createUser: RequestHandler = async (req, res) => {
  const parsedData = createUserSchema.parse(req.body);

  const { organizationId } = getAuthUser(req);

  const user = await usersService.createUser(organizationId, parsedData);

  res.status(201).json({ user });
};

export const deactivateUser: RequestHandler = async (req, res) => {
  const { id } = userIdParamsSchema.parse(req.params);

  const user = await usersService.deactivateUser(getAuthUser(req), id);

  res.json({ user });
};

export const activateUser: RequestHandler = async (req, res) => {
  const { id } = userIdParamsSchema.parse(req.params);
  const { organizationId } = getAuthUser(req);

  const user = await usersService.activateUser(organizationId, id);

  res.json({ user });
};
