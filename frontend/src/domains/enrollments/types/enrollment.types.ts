export interface EnrolledClass {
  id: string;
  name: string;
  martial_art: string;
  has_belt_system: boolean;
  description: string | null;
  teacher_first_name: string;
  schedules: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

export interface Enrollment {
  id: string;
  class_id: string;
  student_id: string;
  status: "active" | "left";
  joined_at: string;
  data_consent_at: string;
  class: EnrolledClass;
}

export interface JoinClassResponse {
  id: string;
  class_id: string;
  student_id: string;
  status: "active" | "left";
  joined_at: string;
  data_consent_at: string;
}
