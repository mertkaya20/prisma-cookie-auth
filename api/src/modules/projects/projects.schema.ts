import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(92);
const descriptionSchema = z.string().trim().min(1).max(320);

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
