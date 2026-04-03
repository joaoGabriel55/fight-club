import type { loginSchema } from "../schemas/login.schema";
import type { registerSchema } from "../schemas/register.schema";
import type { z } from "zod";

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export interface AuthUser {
  id: string;
  first_name: string;
  profile_type: "teacher" | "student";
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string | null;
  profile_type: "teacher" | "student";
  avatar_url: string | null;
  student_profile: {
    weight_kg: string | null;
    height_cm: string | null;
  } | null;
  teacher_profile: {
    fight_experience: string | null;
  } | null;
}
