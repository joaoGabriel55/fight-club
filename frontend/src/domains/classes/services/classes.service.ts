import { apiClient } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type {
  Class,
  ClassListItem,
  ClassStudent,
  CreateClassInput,
  UpdateClassInput,
  CreateScheduleInput,
  ClassSchedule,
} from "../types/class.types";

export const classesService = {
  async getClasses(): Promise<ClassListItem[]> {
    const res =
      await apiClient<PaginatedResponse<ClassListItem>>("/api/v1/classes");
    return res.data;
  },

  async getClass(id: string): Promise<Class> {
    return apiClient<Class>(`/api/v1/classes/${id}`);
  },

  async createClass(data: CreateClassInput): Promise<Class> {
    return apiClient<Class>("/api/v1/classes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateClass(id: string, data: UpdateClassInput): Promise<Class> {
    return apiClient<Class>(`/api/v1/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteClass(id: string): Promise<void> {
    await apiClient<void>(`/api/v1/classes/${id}`, { method: "DELETE" });
  },

  async getClassStudents(id: string): Promise<ClassStudent[]> {
    return apiClient<ClassStudent[]>(`/api/v1/classes/${id}/students`);
  },

  async addSchedule(
    classId: string,
    data: CreateScheduleInput,
  ): Promise<ClassSchedule> {
    return apiClient<ClassSchedule>(`/api/v1/classes/${classId}/schedules`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateSchedule(
    classId: string,
    scheduleId: string,
    data: Partial<CreateScheduleInput>,
  ): Promise<ClassSchedule> {
    return apiClient<ClassSchedule>(
      `/api/v1/classes/${classId}/schedules/${scheduleId}`,
      { method: "PUT", body: JSON.stringify(data) },
    );
  },

  async deleteSchedule(classId: string, scheduleId: string): Promise<void> {
    await apiClient<void>(
      `/api/v1/classes/${classId}/schedules/${scheduleId}`,
      { method: "DELETE" },
    );
  },
};
