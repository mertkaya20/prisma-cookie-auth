import { z } from "zod";
import { TaskStatus } from "../../generated/prisma/enums.js";

const titleSchema = z.string().trim().min(1).max(200);

const descriptionSchema = z.string().trim().min(1).max(2000);

const dueDateSchema = z.string().pipe(z.coerce.date());

const statusSchema = z.enum([
  TaskStatus.done,
  TaskStatus.in_progress,
  TaskStatus.todo,
]);

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  dueDate: dueDateSchema.optional(),
});

export const updateTaskSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    status: statusSchema.optional(),
    dueDate: dueDateSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const listTasksQuerySchema = z.object({
  status: statusSchema.optional(),
});

export const taskIdParamsSchema = z.object({
  id: z.uuid(),
});

export const projectIdParamsSchema = z.object({
  projectId: z.uuid(),
});

export const addAssigneeSchema = z.object({
  userId: z.uuid(),
});

export const removeAssigneeParamsSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
});
