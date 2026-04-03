import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classesService } from "../services/classes.service";

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => classesService.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
