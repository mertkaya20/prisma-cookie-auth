import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  email,
  name: z.string().trim().min(1).max(50),
  password: z.string().min(8).max(72),
  organizationName: z.string().trim().min(1).max(72),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});
