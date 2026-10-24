import { z } from "zod";
import { ProjectRole } from "../../generated/prisma/enums.js";

const nameSchema = z.string().trim().min(1).max(92);
const descriptionSchema = z.string().trim().min(1).max(320);

const projectRoleSchema = z.enum([
  ProjectRole.manager,
  ProjectRole.contributor,
]);

export const createProjectSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
});

export const updateProjectSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const projectIdParamsSchema = z.object({
  id: z.uuid(),
});

export const memberParamsSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
});

export const addMemberSchema = z.object({
  userId: z.uuid(),
  role: projectRoleSchema.optional(),
});

export const updateMemberSchema = z.object({
  role: projectRoleSchema,
});
