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
