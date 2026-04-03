import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classesService } from "../services/classes.service";
import type { Class, UpdateClassInput } from "../types/class.types";

export function useUpdateClass(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Class, Error, UpdateClassInput>({
    mutationFn: (data) => classesService.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", id] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
