import { Router } from "express";
import * as authController from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";
import {
  loginLimiter,
  registerLimiter,
} from "../../shared/middleware/rate-limit.middleware.js";

export const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

authRouter.post("/register", registerLimiter, authController.register);

authRouter.post("/login", loginLimiter, authController.login);

authRouter.post("/logout", authController.logout);

authRouter.get("/me", requireAuth, authController.me);
