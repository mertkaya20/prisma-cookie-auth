import type { RequestHandler } from "express";
import * as usersService from "./users.service.js";
import { getAuthUser } from "../auth/auth.middleware.js";
import { createUserSchema } from "./users.schema.js";

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
