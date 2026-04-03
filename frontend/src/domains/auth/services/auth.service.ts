import { apiClient } from "@/shared/lib/api-client";
import type {
  AuthResponse,
  LoginInput,
  MeResponse,
  RegisterInput,
} from "../types/auth.types";

export const authService = {
  async register(data: Omit<RegisterInput, "consent">): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      unauthenticated: true,
    });
  },

  async login(data: LoginInput): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      unauthenticated: true,
    });
  },

  async logout(): Promise<void> {
    await apiClient<void>("/api/v1/auth/logout", { method: "DELETE" });
  },

  async getMe(): Promise<MeResponse> {
    return apiClient<MeResponse>("/api/v1/auth/me");
  },

  async updateMe(data: Partial<MeResponse>): Promise<MeResponse> {
    return apiClient<MeResponse>("/api/v1/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteMe(): Promise<void> {
    await apiClient<void>("/api/v1/auth/me", { method: "DELETE" });
  },
};
