import express from "express";
import cookieParser from "cookie-parser";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middleware/error.middleware.js";

export const server = express();

server.use(express.json());
server.use(cookieParser());

server.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

server.use(notFoundHandler);
server.use(errorHandler);
