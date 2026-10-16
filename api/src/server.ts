import express from "express";
import cookieParser from "cookie-parser";

export const server = express();

server.use(express.json());
server.use(cookieParser());

server.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

const broken: number = "bu bir sayı değil";
