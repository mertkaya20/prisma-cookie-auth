import type { CookieOptions, RequestHandler, Response } from "express";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "./auth.schema.js";
import * as authService from "./auth.service.js";
import { config } from "../../shared/config.js";
import { getAuthUser, SESSION_COOKIE } from "./auth.middleware.js";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.nodeEnv !== "development",
  path: "/",
};

const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: authService.SESSION_TTL_MS,
  });
};

export const register: RequestHandler = async (req, res) => {
  const parsedData = registerSchema.parse(req.body);
  const { token, user } = await authService.register(parsedData);

  setSessionCookie(res, token);
  res.status(201).json({ user });
};

export const login: RequestHandler = async (req, res) => {
  const parsedData = loginSchema.parse(req.body);
  const { token, user } = await authService.login(parsedData);

  setSessionCookie(res, token);
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

export const changePassword: RequestHandler = async (req, res) => {
  const parsedData = changePasswordSchema.parse(req.body);
  const user = getAuthUser(req);

  const token = await authService.changePassword(user.id, parsedData);

  setSessionCookie(res, token);
  res.status(204).end();
};
