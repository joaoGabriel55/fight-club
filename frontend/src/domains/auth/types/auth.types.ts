import type { loginSchema } from "../schemas/login.schema";
import type { registerSchema } from "../schemas/register.schema";
import type { z } from "zod";

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const MARTIAL_ARTS = [
  "Kickboxing",
  "Muay Thai",
  "Brazilian Jiu-Jitsu (BJJ)",
  "Boxing",
  "Wrestling",
  "Catch Wrestling",
  "Judo",
  "Luta Livre",
  "Karate",
  "Capoeira",
  "Taekwondo",
  "Sanda/Sanshou",
  "Sambo",
] as const;

export type MartialArt = (typeof MARTIAL_ARTS)[number];

/** Martial arts that use a belt ranking system */
export const BELT_MARTIAL_ARTS: ReadonlySet<MartialArt> = new Set([
  "Brazilian Jiu-Jitsu (BJJ)",
  "Judo",
  "Karate",
  "Taekwondo",
  "Capoeira",
]);

export const BELT_LEVELS = [
  "White",
  "Yellow",
  "Red",
  "Orange",
  "Green",
  "Blue",
  "Purple",
  "Brown",
  "Black",
] as const;

export type BeltLevel = (typeof BELT_LEVELS)[number];

export const COMPETITION_LEVELS = ["amateur", "professional"] as const;

export type CompetitionLevel = (typeof COMPETITION_LEVELS)[number];

export interface MartialArtExperience {
  martial_art: MartialArt;
  experience_years: number;
  belt_level?: BeltLevel | null;
  competition_level?: CompetitionLevel | null;
}

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
    fight_experience: MartialArtExperience[] | null;
  } | null;
  teacher_profile: {
    fight_experience: MartialArtExperience[] | null;
  } | null;
}
