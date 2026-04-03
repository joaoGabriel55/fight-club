import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  profile_type: z.enum(["teacher", "student"], {
    required_error: "Profile type is required",
  }),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to register" }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
