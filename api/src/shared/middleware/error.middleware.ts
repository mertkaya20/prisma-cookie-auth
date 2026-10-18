import { ZodError } from "zod";
import { AppError, NotFoundError } from "../errors.js";
import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = () => {
  throw new NotFoundError();
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        issues: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }
  if (
    err.expose === true &&
    typeof err.status === "number" &&
    err.status >= 400 &&
    err.status < 500
  ) {
    res.status(err.status).json({
      error: {
        code: "BAD_REQUEST",
        message: err.message,
      },
    });
    return;
  }
  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    },
  });
};
