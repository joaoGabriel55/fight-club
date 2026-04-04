import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../services/notifications.service";
import { ApiError } from "@/shared/lib/api-client";

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation<{ updated: number }, ApiError, void>({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
