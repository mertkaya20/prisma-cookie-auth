import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { TooManyRequestsError } from "../errors.js";
import { config } from "../config.js";

const handler: RequestHandler = (_req, _res, next) => {
  next(new TooManyRequestsError());
};

const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => config.nodeEnv === "test",
};

const byIp = { ipv6Subnet: 56 };

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  ...commonOptions,
  ...byIp,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  ...commonOptions,
  ...byIp,
});

export const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.user!.id,
  ...commonOptions,
});
