import { useQuery } from "@tanstack/react-query";
import { classesService } from "../services/classes.service";
import type { ClassStudentDetail } from "../types/class.types";

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "students"],
    queryFn: () => classesService.getClassStudents(classId),
    enabled: !!classId,
  });
}

export function useStudentProfile(classId: string, studentId: string) {
  return useQuery<ClassStudentDetail>({
    queryKey: ["classes", classId, "students", studentId],
    queryFn: () => classesService.getStudentDetail(classId, studentId),
    enabled: !!classId && !!studentId,
  });
}
