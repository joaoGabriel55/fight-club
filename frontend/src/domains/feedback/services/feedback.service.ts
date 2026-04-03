import { apiClient } from "@/shared/lib/api-client";
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
    return apiClient<MyFeedbackItem[]>("/api/v1/feedback");
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
