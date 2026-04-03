import { useMutation } from "@tanstack/react-query";
import { setToken } from "@/shared/lib/api-client";
import { authService } from "../services/auth.service";
import type { LoginInput, AuthResponse } from "../types/auth.types";

export function useLogin() {
  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: (data) => authService.login(data),
    onSuccess: ({ token }) => {
      setToken(token);
    },
  });
}
