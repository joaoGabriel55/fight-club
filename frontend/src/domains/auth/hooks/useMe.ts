import { useQuery } from "@tanstack/react-query";
import { isAuthenticated } from "@/shared/lib/api-client";
import { authService } from "../services/auth.service";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authService.getMe(),
    enabled: isAuthenticated(),
    retry: false,
  });
}
