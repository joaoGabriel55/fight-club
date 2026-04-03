import { z } from "zod";

export const sendFeedbackSchema = z.object({
  content: z.string().min(10, "Feedback must be at least 10 characters"),
});

export type SendFeedbackInput = z.infer<typeof sendFeedbackSchema>;
