import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { enrollmentsService } from "../services/enrollments.service";
import type { JoinClassResponse } from "../types/enrollment.types";
import { ApiError } from "@/shared/lib/api-client";

export function useJoinClass() {
  const navigate = useNavigate();

  return useMutation<JoinClassResponse, ApiError, { token: string }>({
    mutationFn: ({ token }) => enrollmentsService.joinClass(token, true),
    onSuccess: () => {
      navigate({ to: "/dashboard" });
    },
  });
}
