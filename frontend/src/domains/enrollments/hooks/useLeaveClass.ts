import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentsService } from "../services/enrollments.service";
import { ApiError } from "@/shared/lib/api-client";

export function useLeaveClass() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (enrollmentId) => enrollmentsService.leaveClass(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
