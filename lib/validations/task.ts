import { z } from "zod";
import { TaskStatus, TaskPriority } from "@/app/types";

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  category: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()),
  assigned_to: z.string().optional().or(z.literal("")),
  parent_id: z.string().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  cycle_id: z.string().optional().or(z.literal("")),
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const taskCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});

export type TaskCommentFormData = z.infer<typeof taskCommentSchema>;
