import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(0).max(5),
  comment: z.string().max(1000).optional(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(0).max(5),
  comment: z.string().max(1000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
