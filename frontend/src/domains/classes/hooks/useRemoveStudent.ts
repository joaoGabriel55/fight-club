import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classesService } from "../services/classes.service";

export function useRemoveStudent(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enrollmentId: string) =>
      classesService.removeStudent(classId, enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classes", classId, "students"],
      });
    },
  });
}
