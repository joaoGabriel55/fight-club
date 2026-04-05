import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRegister } from "./useRegister";
import * as authService from "../services/auth.service";
import * as apiClient from "@/shared/lib/api-client";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useRegister", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls authService.register with correct data", async () => {
    const registerSpy = vi
      .spyOn(authService.authService, "register")
      .mockResolvedValue({
        token: "tok-new",
        user: { id: "1", first_name: "Bob", profile_type: "student" },
      });

    const { result } = renderHook(() => useRegister(), {
      wrapper: makeWrapper(),
    });

    const input = {
      first_name: "Bob",
      last_name: "Smith",
      email: "bob@example.com",
      password: "Secure123!",
      birth_date: "2000-01-01",
      profile_type: "student" as const,
    };

    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
    expect(registerSpy).toHaveBeenCalledWith(input);
  });

  it("calls setToken on success", async () => {
    vi.spyOn(authService.authService, "register").mockResolvedValue({
      token: "tok-new",
      user: { id: "1", first_name: "Bob", profile_type: "student" },
    });
    const setTokenSpy = vi.spyOn(apiClient, "setToken");

    const { result } = renderHook(() => useRegister(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({
      first_name: "Bob",
      last_name: "Smith",
      email: "bob@example.com",
      password: "Secure123!",
      birth_date: "2000-01-01",
      profile_type: "student" as const,
    });

    await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
    expect(setTokenSpy).toHaveBeenCalledWith("tok-new");
  });

  it("returns error on failure", async () => {
    vi.spyOn(authService.authService, "register").mockRejectedValue(
      new Error("Email already taken"),
    );

    const { result } = renderHook(() => useRegister(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({
      first_name: "Bob",
      last_name: "Smith",
      email: "bob@example.com",
      password: "Secure123!",
      birth_date: "2000-01-01",
      profile_type: "student" as const,
    });

    await waitFor(() => expect(result.current.isError).toBeTruthy());
    expect(result.current.error?.message).toMatch(/email already taken/i);
  });
});
