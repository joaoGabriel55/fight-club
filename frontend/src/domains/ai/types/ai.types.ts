export const FOCUS_AREAS = [
  "Striking technique",
  "Ground game",
  "Takedowns",
  "Defense",
  "Conditioning",
  "Flexibility",
  "Sparring strategy",
  "Competition preparation",
  "Forms / Kata",
  "Footwork",
] as const;

export type FocusArea = (typeof FOCUS_AREAS)[number];

export interface ImprovementTipsRequest {
  feedback_id?: string;
  martial_art?: string;
  focus_area?: FocusArea;
}

export interface ImprovementTipsResponse {
  tips: string;
}
