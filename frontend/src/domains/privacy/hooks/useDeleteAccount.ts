import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { privacyService } from "../services/privacy.service";
import { clearToken } from "@/shared/lib/api-client";

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: privacyService.eraseMyData,
    onSuccess: () => {
      clearToken();
      queryClient.removeQueries({ queryKey: ["me"] });
      router.navigate({ to: "/login" });
    },
  });
}
