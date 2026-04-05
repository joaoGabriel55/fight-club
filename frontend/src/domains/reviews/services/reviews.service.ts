import { apiClient } from "@/shared/lib/api-client";
import type {
  Review,
  ReviewSummary,
  CreateReviewInput,
  UpdateReviewInput,
} from "../types/review.types";

export const reviewsService = {
  async createReview(
    classId: string,
    data: CreateReviewInput,
  ): Promise<Review> {
    return apiClient<Review>(`/api/v1/classes/${classId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateReview(
    classId: string,
    reviewId: string,
    data: UpdateReviewInput,
  ): Promise<Review> {
    return apiClient<Review>(`/api/v1/classes/${classId}/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async getClassReviews(
    classId: string,
    sessionDate?: string,
  ): Promise<Review[]> {
    const params = sessionDate ? `?session_date=${sessionDate}` : "";
    return apiClient<Review[]>(`/api/v1/classes/${classId}/reviews${params}`);
  },

  async getClassReviewSummary(
    classId: string,
    sessionDate?: string,
  ): Promise<ReviewSummary> {
    const params = sessionDate ? `?session_date=${sessionDate}` : "";
    return apiClient<ReviewSummary>(
      `/api/v1/classes/${classId}/reviews/summary${params}`,
    );
  },

  async getMyReviews(classId: string): Promise<Review[]> {
    return apiClient<Review[]>(`/api/v1/my-reviews/${classId}`);
  },
};
