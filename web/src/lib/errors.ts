import { ApiError } from "./api";

const messages: Record<string, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  ORGANIZATION_SUSPENDED:
    "Your organization is suspended. Contact your administrator.",
  TOO_MANY_REQUESTS: "Too many attempts. Wait a few minutes and try again.",
  EMAIL_TAKEN: "An account with this email already exists. Log in instead.",
  VALIDATION_ERROR: "Some fields are not valid. Check them and try again.",
  UNAUTHORIZED: "Your session has ended. Log in again.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "This item doesn't exist or was deleted.",
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return messages[error.code] ?? error.message;
  }
  return "Can't reach the server. Check your connection and try again.";
}
