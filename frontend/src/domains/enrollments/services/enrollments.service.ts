import { apiClient } from "@/shared/lib/api-client";
import type { Enrollment, JoinClassResponse } from "../types/enrollment.types";

export interface ClassFromTokenResponse {
  class_name: string;
  martial_art: string;
  teacher_first_name: string;
}

export const enrollmentsService = {
  async getClassFromToken(token: string): Promise<ClassFromTokenResponse> {
    return apiClient<ClassFromTokenResponse>(
      `/api/v1/invitations/${token}/class`,
      { unauthenticated: true },
    );
  },

  async joinClass(token: string, consent: true): Promise<JoinClassResponse> {
    return apiClient<JoinClassResponse>(`/api/v1/join/${token}`, {
      method: "POST",
      body: JSON.stringify({ consent }),
    });
  },

  async getEnrollments(): Promise<Enrollment[]> {
    return apiClient<Enrollment[]>("/api/v1/enrollments");
  },

  async leaveClass(id: string): Promise<void> {
    await apiClient<void>(`/api/v1/enrollments/${id}`, { method: "DELETE" });
  },
};
