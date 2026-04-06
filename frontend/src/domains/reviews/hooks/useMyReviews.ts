import { useQuery } from "@tanstack/react-query";
import { reviewsService } from "../services/reviews.service";

export function useMyReviews(classId: string) {
  return useQuery({
    queryKey: ["reviews", "my", classId],
    queryFn: () => reviewsService.getMyReviews(classId),
    enabled: !!classId,
  });
}
