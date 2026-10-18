import type { RequestHandler } from "express";
import { registerSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";

export const register: RequestHandler = async (req, res) => {
  const parsedData = registerSchema.parse(req.body);
  const createdUser = await authService.register(parsedData);

  res.status(201).json({ user: createdUser });
};
