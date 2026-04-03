export interface ClassSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Class {
  id: string;
  name: string;
  martial_art: string;
  has_belt_system: boolean;
  description: string | null;
  created_at: string;
  schedules: ClassSchedule[];
}

export interface ClassListItem {
  id: string;
  name: string;
  martial_art: string;
  has_belt_system: boolean;
  description: string | null;
  schedule_count: number;
  enrollment_count: number;
  created_at: string;
}

export interface ClassStudent {
  id: string;
  first_name: string;
  belt_level: string | null;
  enrolled_at: string;
}

export interface CreateClassInput {
  name: string;
  martial_art: string;
  has_belt_system: boolean;
  description?: string | null;
  schedules: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

export interface UpdateClassInput {
  name?: string;
  martial_art?: string;
  has_belt_system?: boolean;
  description?: string | null;
}

export interface CreateScheduleInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
}
