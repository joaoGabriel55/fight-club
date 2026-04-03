import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classesService } from "../services/classes.service";
import type { Class, CreateClassInput } from "../types/class.types";

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation<Class, Error, CreateClassInput>({
    mutationFn: (data) => classesService.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
