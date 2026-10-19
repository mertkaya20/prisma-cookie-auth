import type { Request, RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "../../shared/errors.js";
import * as authService from "./auth.service.js";
import type { SessionUser } from "./auth.service.js";
import type { Role } from "../../generated/prisma/enums.js";

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

export const requireRole = (role: Role): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (req.user.role !== role) {
      throw new ForbiddenError();
    }

    next();
  };
};

export const getAuthUser = (req: Request): SessionUser => {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
};
