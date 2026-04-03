import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must be at most 255 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
