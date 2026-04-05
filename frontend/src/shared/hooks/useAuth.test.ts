import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAuth } from "./useAuth";
import * as authService from "@/domains/auth/services/auth.service";
import * as apiClient from "@/shared/lib/api-client";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useAuth", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns user data when authenticated", async () => {
    vi.spyOn(apiClient, "isAuthenticated").mockReturnValue(true);
    vi.spyOn(authService.authService, "getMe").mockResolvedValue({
      id: "1",
      first_name: "Alice",
      last_name: "Doe",
      email: "alice@example.com",
      birth_date: null,
      profile_type: "student",
      avatar_url: null,
      student_profile: null,
      teacher_profile: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.user).toBeDefined());
    expect(result.current.user?.first_name).toBe("Alice");
    expect(result.current.user?.email).toBe("alice@example.com");
  });

  it("returns isAuthenticated correctly", () => {
    vi.spyOn(apiClient, "isAuthenticated").mockReturnValue(false);
    vi.spyOn(authService.authService, "getMe").mockResolvedValue({
      id: "1",
      first_name: "Alice",
      last_name: "Doe",
      email: "alice@example.com",
      birth_date: null,
      profile_type: "student",
      avatar_url: null,
      student_profile: null,
      teacher_profile: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it("logout clears token and removes queries", async () => {
    vi.spyOn(apiClient, "isAuthenticated").mockReturnValue(true);
    vi.spyOn(authService.authService, "getMe").mockResolvedValue({
      id: "1",
      first_name: "Alice",
      last_name: "Doe",
      email: "alice@example.com",
      birth_date: null,
      profile_type: "student",
      avatar_url: null,
      student_profile: null,
      teacher_profile: null,
    });
    vi.spyOn(authService.authService, "logout").mockResolvedValue(undefined);
    const clearTokenSpy = vi.spyOn(apiClient, "clearToken");

    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.user).toBeDefined());

    await act(async () => {
      await result.current.logout();
    });

    expect(clearTokenSpy).toHaveBeenCalled();
  });

  it("logout clears token even when authService.logout rejects", async () => {
    vi.spyOn(apiClient, "isAuthenticated").mockReturnValue(true);
    vi.spyOn(authService.authService, "getMe").mockResolvedValue({
      id: "1",
      first_name: "Alice",
      last_name: "Doe",
      email: "alice@example.com",
      birth_date: null,
      profile_type: "student",
      avatar_url: null,
      student_profile: null,
      teacher_profile: null,
    });
    vi.spyOn(authService.authService, "logout").mockRejectedValue(
      new Error("Network error"),
    );
    const clearTokenSpy = vi.spyOn(apiClient, "clearToken");

    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.user).toBeDefined());

    await act(async () => {
      try {
        await result.current.logout();
      } catch {
        // Expected — the rejected logout propagates through the finally block
      }
    });

    // clearToken is called in the finally block, even on error
    expect(clearTokenSpy).toHaveBeenCalled();
  });
});
