import { ApiError } from "./api";

const messages: Record<string, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  ORGANIZATION_SUSPENDED:
    "Your organization is suspended. Contact your administrator.",
  TOO_MANY_REQUESTS: "Too many attempts. Wait a few minutes and try again.",
  EMAIL_TAKEN: "An account with this email already exists. Log in instead.",
  VALIDATION_ERROR: "Some fields are not valid. Check them and try again.",
  UNAUTHORIZED: "Your session has ended. Log in again.",
  INVALID_CURRENT_PASSWORD: "Your current password is wrong.",
  SAME_PASSWORD: "Choose a password that's different from your current one.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "This item doesn't exist or was deleted.",
  PROJECT_NAME_TAKEN:
    "A project with this name already exists. Choose another name.",
  TAG_NAME_TAKEN: "A tag with this name already exists.",
  TAG_NOT_FOUND: "This tag doesn't exist anymore.",
  TAG_ALREADY_ADDED: "This tag is already on the task.",
  ASSIGNEE_NOT_IN_PROJECT: "Only people on the project team can be assigned.",
  ALREADY_ASSIGNED: "This person is already assigned.",
  USER_NOT_FOUND: "This person isn't in your organization.",
  USER_ALREADY_PROJECT_MEMBER: "This person is already on the team.",
  USER_DEACTIVATED:
    "This account is deactivated. An owner can turn it back on from the People page.",
  CANNOT_DEACTIVATE_SELF: "You can't deactivate your own account.",
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return messages[error.code] ?? error.message;
  }
  return "Can't reach the server. Check your connection and try again.";
}
