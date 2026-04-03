import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useClasses } from "./useClasses";
import * as classesService from "../services/classes.service";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

const mockClasses = [
  {
    id: "class-1",
    name: "BJJ Basics",
    martial_art: "BJJ",
    has_belt_system: true,
    description: null,
    schedule_count: 2,
    enrollment_count: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "class-2",
    name: "Muay Thai",
    martial_art: "Muay Thai",
    has_belt_system: false,
    description: "Striking art",
    schedule_count: 1,
    enrollment_count: 0,
    created_at: new Date().toISOString(),
  },
];

describe("useClasses", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns an array of 2 classes from mock", async () => {
    vi.spyOn(classesService.classesService, "getClasses").mockResolvedValue(
      mockClasses,
    );

    const { result } = renderHook(() => useClasses(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it("returns class ids from mock data", async () => {
    vi.spyOn(classesService.classesService, "getClasses").mockResolvedValue(
      mockClasses,
    );

    const { result } = renderHook(() => useClasses(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].id).toBe("class-1");
    expect(result.current.data![1].id).toBe("class-2");
  });

  it("sets error state on failure", async () => {
    vi.spyOn(classesService.classesService, "getClasses").mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useClasses(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/network error/i);
  });
});
