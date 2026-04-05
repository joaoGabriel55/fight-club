import { useQuery } from "@tanstack/react-query";
import { classesService } from "../services/classes.service";

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "students"],
    queryFn: () => classesService.getClassStudents(classId),
    enabled: !!classId,
  });
}

export function useStudentProfile(classId: string, studentId: string) {
  return useQuery({
    queryKey: ["classes", classId, "students", studentId],
    queryFn: async () => {
      const students = await classesService.getClassStudents(classId);
      return students.find((s) => s.id === studentId);
    },
    enabled: !!classId && !!studentId,
  });
}
