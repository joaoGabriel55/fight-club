import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useLogin } from "./useLogin";
import * as authService from "../services/auth.service";
import * as apiClient from "@/shared/lib/api-client";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useLogin", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls setToken on success", async () => {
    vi.spyOn(authService.authService, "login").mockResolvedValue({
      token: "tok-abc",
      user: { id: "1", first_name: "Alice", profile_type: "student" },
    });
    const setTokenSpy = vi.spyOn(apiClient, "setToken");

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    result.current.mutate({
      email: "alice@example.com",
      password: "password1",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(setTokenSpy).toHaveBeenCalledWith("tok-abc");
  });

  it("sets mutation error state on 401 response", async () => {
    vi.spyOn(authService.authService, "login").mockRejectedValue(
      new Error("Invalid credentials"),
    );

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    result.current.mutate({ email: "alice@example.com", password: "wrong" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/invalid credentials/i);
  });
});
