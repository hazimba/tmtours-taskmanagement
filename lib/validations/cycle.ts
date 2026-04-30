import { z } from "zod";
import { CycleStatus } from "@/app/types";

export const cycleSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  status: z.nativeEnum(CycleStatus),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
});

export type CycleFormData = z.infer<typeof cycleSchema>;
