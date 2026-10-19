import express from "express";
import cookieParser from "cookie-parser";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middleware/error.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

export const server = express();

server.use(express.json());
server.use(cookieParser());

server.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

server.use("/auth", authRouter);
server.use("/users", usersRouter);

server.use(notFoundHandler);
server.use(errorHandler);
