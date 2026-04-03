import { useQuery } from "@tanstack/react-query";
import { enrollmentsService } from "../services/enrollments.service";
import type { Enrollment } from "../types/enrollment.types";

export function useEnrollments() {
  return useQuery<Enrollment[]>({
    queryKey: ["enrollments"],
    queryFn: enrollmentsService.getEnrollments,
  });
}
