import { z } from "zod";

export const joinSchema = z.object({
  consent: z.literal(true, {
    errorMap: () => ({
      message: "You must accept the data sharing terms to join.",
    }),
  }),
});

export type JoinInput = z.infer<typeof joinSchema>;
