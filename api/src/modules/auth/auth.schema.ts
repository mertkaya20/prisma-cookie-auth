import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const nameSchema = z.string().trim().min(1).max(50);

export const passwordSchema = z.string().min(8).max(72);

export const registerSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  organizationName: z.string().trim().min(1).max(72),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});
