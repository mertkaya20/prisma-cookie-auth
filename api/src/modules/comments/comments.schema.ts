import { z } from "zod";

const bodySchema = z.string().trim().min(1).max(2000);

export const commentBodySchema = z.object({
  body: bodySchema,
});

export const taskIdParamsSchema = z.object({
  taskId: z.uuid(),
});

export const commentParamsSchema = z.object({
  id: z.uuid(),
});
