import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  passwordSchema,
} from "../auth/auth.schema.js";
import { Role } from "../../generated/prisma/enums.js";

export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  role: z.enum([Role.owner, Role.member]).default(Role.member),
});
