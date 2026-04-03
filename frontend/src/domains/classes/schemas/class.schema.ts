import { z } from "zod";
import { scheduleSchema } from "./schedule.schema";

export const createClassSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  martial_art: z.string().trim().min(1, "Martial art is required"),
  has_belt_system: z.boolean(),
  description: z.string().trim().nullable().optional(),
  schedules: z
    .array(scheduleSchema)
    .min(1, "At least one schedule is required"),
});

export const updateClassSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .optional(),
  martial_art: z.string().trim().min(1, "Martial art is required").optional(),
  has_belt_system: z.boolean().optional(),
  description: z.string().trim().nullable().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
