export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super(401, "UNAUTHORIZED", "Authentication required");
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor() {
    super(404, "NOT_FOUND", "Not found");
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super(403, "FORBIDDEN", "Insufficient permissions");
    this.name = "ForbiddenError";
  }
}

export class TooManyRequestsError extends AppError {
  constructor() {
    super(
      429,
      "TOO_MANY_REQUESTS",
      "Too many requests, please try again later",
    );
    this.name = "TooManyRequestsError";
  }
}
