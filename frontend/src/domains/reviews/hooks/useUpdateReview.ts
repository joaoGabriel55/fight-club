import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsService } from "../services/reviews.service";
import type { UpdateReviewInput } from "../types/review.types";
import type { Review } from "../types/review.types";
import { ApiError } from "@/shared/lib/api-client";

export function useUpdateReview(classId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Review,
    ApiError,
    { reviewId: string; data: UpdateReviewInput }
  >({
    mutationFn: ({ reviewId, data }) =>
      reviewsService.updateReview(classId, reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "my", classId] });
    },
  });
}
