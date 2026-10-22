import express from "express";
import cookieParser from "cookie-parser";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middleware/error.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { config } from "./shared/config.js";
import { projectsRouter } from "./modules/projects/projects.routes.js";
import { tagsRouter } from "./modules/tags/tags.routes.js";

export const server = express();
if (config.trustProxy > 0) {
  server.set("trust proxy", config.trustProxy);
}

server.disable("x-powered-by");

server.use(express.json());
server.use(cookieParser());

server.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

server.use("/auth", authRouter);
server.use("/users", usersRouter);
server.use("/projects", projectsRouter);
server.use("/tags", tagsRouter);

server.use(notFoundHandler);
server.use(errorHandler);
