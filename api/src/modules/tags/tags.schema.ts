import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(40);

const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be in #RRGGBB format")
  .toUpperCase();

export const createTagSchema = z.object({
  name: nameSchema,
  color: colorSchema.optional(),
});

export const updateTagSchema = z
  .object({
    name: nameSchema.optional(),
    color: colorSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const tagIdParamsSchema = z.object({
  id: z.uuid(),
});
