import { z } from "zod";

export const scheduleSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => {
      const toMinutes = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + (m ?? 0);
      };
      return toMinutes(data.end_time) > toMinutes(data.start_time);
    },
    { message: "End time must be after start time", path: ["end_time"] },
  );

export type ScheduleInput = z.infer<typeof scheduleSchema>;
