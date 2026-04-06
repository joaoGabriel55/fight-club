import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsService } from "../services/reviews.service";
import type { CreateReviewInput } from "../types/review.types";
import type { Review } from "../types/review.types";
import { ApiError } from "@/shared/lib/api-client";

export function useCreateReview(classId: string) {
  const queryClient = useQueryClient();

  return useMutation<Review, ApiError, CreateReviewInput>({
    mutationFn: (data) => reviewsService.createReview(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "my", classId] });
    },
  });
}
