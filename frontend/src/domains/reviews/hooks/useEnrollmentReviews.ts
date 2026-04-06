import { useQuery } from "@tanstack/react-query";
import { reviewsService } from "../services/reviews.service";

export function useEnrollmentReviews(enrollmentId: string) {
  return useQuery({
    queryKey: ["reviews", "enrollment", enrollmentId],
    queryFn: () => reviewsService.getEnrollmentReviews(enrollmentId),
    enabled: !!enrollmentId,
  });
}