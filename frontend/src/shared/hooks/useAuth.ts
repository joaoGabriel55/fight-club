import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearToken, isAuthenticated } from "@/shared/lib/api-client";
import { authService } from "@/domains/auth/services/auth.service";
import { useMe } from "@/domains/auth/hooks/useMe";
import { useLogin } from "@/domains/auth/hooks/useLogin";
import { useRegister } from "@/domains/auth/hooks/useRegister";

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useMe();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearToken();
      queryClient.removeQueries({ queryKey: ["me"] });
    }
  }, [queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: isAuthenticated(),
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
  };
}
