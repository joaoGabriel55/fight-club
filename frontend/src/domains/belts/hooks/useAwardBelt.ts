import { useMutation, useQueryClient } from "@tanstack/react-query";
import { beltsService } from "../services/belts.service";
import type { BeltProgress, AwardBeltInput } from "../types/belt.types";
import { ApiError } from "@/shared/lib/api-client";

export function useAwardBelt(enrollmentId: string) {
  const queryClient = useQueryClient();

  return useMutation<BeltProgress, ApiError, AwardBeltInput>({
    mutationFn: (data) => beltsService.awardBelt(enrollmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["belts", enrollmentId] });
    },
  });
}
