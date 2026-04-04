import { apiClient } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type {
  FeedbackItem,
  MyFeedbackItem,
  SendFeedbackInput,
} from "../types/feedback.types";

export const feedbackService = {
  async getEnrollmentFeedback(enrollmentId: string): Promise<FeedbackItem[]> {
    return apiClient<FeedbackItem[]>(
      `/api/v1/enrollments/${enrollmentId}/feedback`,
    );
  },

  async getMyFeedback(): Promise<MyFeedbackItem[]> {
    const res =
      await apiClient<PaginatedResponse<MyFeedbackItem>>("/api/v1/feedback");
    return res.data;
  },

  async sendFeedback(
    enrollmentId: string,
    data: SendFeedbackInput,
  ): Promise<FeedbackItem> {
    return apiClient<FeedbackItem>(
      `/api/v1/enrollments/${enrollmentId}/feedback`,
      { method: "POST", body: JSON.stringify(data) },
    );
  },
};
