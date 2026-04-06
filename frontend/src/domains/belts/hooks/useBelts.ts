import { useQuery } from "@tanstack/react-query";
import { beltsService } from "../services/belts.service";
import type { BeltProgress } from "../types/belt.types";

export function useBelts(enrollmentId: string) {
  return useQuery<BeltProgress[]>({
    queryKey: ["belts", enrollmentId],
    queryFn: () => beltsService.getBelts(enrollmentId),
    enabled: !!enrollmentId,
  });
}
