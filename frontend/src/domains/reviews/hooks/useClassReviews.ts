import { useQuery } from "@tanstack/react-query";
import { reviewsService } from "../services/reviews.service";

export function useClassReviews(classId: string, sessionDate?: string) {
  return useQuery({
    queryKey: ["reviews", "class", classId, sessionDate],
    queryFn: () => reviewsService.getClassReviews(classId, sessionDate),
    enabled: !!classId,
  });
}

export function useClassReviewSummary(classId: string, sessionDate?: string) {
  return useQuery({
    queryKey: ["reviews", "summary", classId, sessionDate],
    queryFn: () => reviewsService.getClassReviewSummary(classId, sessionDate),
    enabled: !!classId,
  });
}
