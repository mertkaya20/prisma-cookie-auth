import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { TooManyRequestsError } from "../errors.js";

const handler: RequestHandler = (_req, _res, next) => {
  next(new TooManyRequestsError());
};

const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler,
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  ...commonOptions,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  ...commonOptions,
});
