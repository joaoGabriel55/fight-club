import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../services/notifications.service";
import { ApiError } from "@/shared/lib/api-client";

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; read_at: string }, ApiError, string>({
    mutationFn: (id) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
