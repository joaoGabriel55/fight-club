export interface BeltProgress {
  id: string;
  belt_name: string;
  awarded_at: string;
  awarded_by: { first_name: string };
}

export interface AwardBeltInput {
  belt_name: string;
  awarded_at: string;
}
