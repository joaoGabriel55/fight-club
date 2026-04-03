import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCreateClass } from "./useCreateClass";
import * as classesService from "../services/classes.service";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children),
    qc,
  };
}

const mockClass = {
  id: "new-class-id",
  name: "BJJ Basics",
  martial_art: "BJJ",
  has_belt_system: true,
  description: null,
  created_at: new Date().toISOString(),
  schedules: [
    { id: "sched-1", day_of_week: 1, start_time: "09:00", end_time: "10:00" },
  ],
};

describe("useCreateClass", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls createClass service and invalidates ['classes'] on success", async () => {
    vi.spyOn(classesService.classesService, "createClass").mockResolvedValue(
      mockClass,
    );

    const { wrapper, qc } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useCreateClass(), { wrapper });

    result.current.mutate({
      name: "BJJ Basics",
      martial_art: "BJJ",
      has_belt_system: true,
      schedules: [{ day_of_week: 1, start_time: "09:00", end_time: "10:00" }],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["classes"] }),
    );
  });

  it("sets error state when service fails", async () => {
    vi.spyOn(classesService.classesService, "createClass").mockRejectedValue(
      new Error("Validation failed"),
    );

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateClass(), { wrapper });

    result.current.mutate({
      name: "BJJ Basics",
      martial_art: "BJJ",
      has_belt_system: false,
      schedules: [{ day_of_week: 1, start_time: "09:00", end_time: "10:00" }],
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/validation failed/i);
  });
});
