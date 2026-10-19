import type { CookieOptions, RequestHandler } from "express";
import { loginSchema, registerSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";
import { config } from "../../shared/config.js";
import { SESSION_COOKIE } from "./auth.middleware.js";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.nodeEnv !== "development",
  path: "/",
};

export const register: RequestHandler = async (req, res) => {
  const parsedData = registerSchema.parse(req.body);
  const createdUser = await authService.register(parsedData);

  res.status(201).json({ user: createdUser });
};

export const login: RequestHandler = async (req, res) => {
  const parsedData = loginSchema.parse(req.body);
  const { token, user } = await authService.login(parsedData);

  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: authService.SESSION_TTL_MS,
  });
  res.json({ user });
};

export const logout: RequestHandler = async (req, res) => {
  const token = req.cookies[SESSION_COOKIE];

  if (typeof token === "string") {
    await authService.logout(token);
  }

  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.status(204).end();
};

export const me: RequestHandler = (req, res) => {
  res.json({ user: req.user });
};
