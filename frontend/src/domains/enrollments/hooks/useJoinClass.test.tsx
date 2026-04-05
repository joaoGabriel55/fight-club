import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useJoinClass } from "./useJoinClass";
import * as enrollmentsService from "../services/enrollments.service";
import { ApiError } from "@/shared/lib/api-client";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useJoinClass", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
  });

  it("navigates to /dashboard on success", async () => {
    vi.spyOn(
      enrollmentsService.enrollmentsService,
      "joinClass",
    ).mockResolvedValue({
      id: "enr-1",
      class_id: "cls-1",
      student_id: "stu-1",
      status: "active",
      joined_at: new Date().toISOString(),
      data_consent_at: new Date().toISOString(),
    });

    const { result } = renderHook(() => useJoinClass(), { wrapper });
    result.current.mutate({ token: "abc-token" });

    await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("exposes 409 error when already enrolled", async () => {
    vi.spyOn(
      enrollmentsService.enrollmentsService,
      "joinClass",
    ).mockRejectedValue(
      new ApiError(409, "You are already enrolled in this class"),
    );

    const { result } = renderHook(() => useJoinClass(), { wrapper });
    result.current.mutate({ token: "abc-token" });

    await waitFor(() => expect(result.current.isError).toBeTruthy());
    expect((result.current.error as ApiError).status).toBe(409);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
