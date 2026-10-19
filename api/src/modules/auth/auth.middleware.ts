import type { RequestHandler } from "express";
import { UnauthorizedError } from "../../shared/errors.js";
import * as authService from "./auth.service.js";
import type { SessionUser } from "./auth.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export const SESSION_COOKIE = "taskapp_session";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies[SESSION_COOKIE];

  if (!token || typeof token !== "string") {
    throw new UnauthorizedError();
  }

  const user = await authService.getSessionUser(token);

  if (user === null) {
    throw new UnauthorizedError();
  }

  req.user = user;
  next();
};
