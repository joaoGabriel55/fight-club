import { useMutation } from "@tanstack/react-query";
import { setToken } from "@/shared/lib/api-client";
import { authService } from "../services/auth.service";
import type { RegisterInput, AuthResponse } from "../types/auth.types";

export function useRegister() {
  return useMutation<AuthResponse, Error, Omit<RegisterInput, "consent">>({
    mutationFn: (data) => authService.register(data),
    onSuccess: ({ token }) => {
      setToken(token);
    },
  });
}
