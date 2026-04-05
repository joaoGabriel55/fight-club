import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNotifications } from "./useNotifications";
import * as notificationsService from "../services/notifications.service";
import { createElement } from "react";

describe("useNotifications", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("is configured with refetchInterval: 60000", async () => {
    vi.spyOn(
      notificationsService.notificationsService,
      "getNotifications",
    ).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, per_page: 20, unread_count: 0 },
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) =>
        createElement(QueryClientProvider, { client: qc }, children),
    });

    await waitFor(() => expect(result.current.isSuccess).toBeTruthy());

    // Check the query options via the query cache
    const queryCache = qc.getQueryCache();
    const query = queryCache.find({ queryKey: ["notifications"] });
    expect((query?.options as Record<string, unknown>).refetchInterval).toBe(
      60000,
    );
  });
});
