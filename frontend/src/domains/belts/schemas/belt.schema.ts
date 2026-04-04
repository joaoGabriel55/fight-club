import { z } from "zod";

export const awardBeltSchema = z.object({
  belt_name: z.string().min(1, "Belt name is required"),
  awarded_at: z.string().min(1, "Date is required"),
});
