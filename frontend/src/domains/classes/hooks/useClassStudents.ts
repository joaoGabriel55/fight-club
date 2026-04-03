import { useQuery } from "@tanstack/react-query";
import { classesService } from "../services/classes.service";

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "students"],
    queryFn: () => classesService.getClassStudents(classId),
    enabled: !!classId,
  });
}
