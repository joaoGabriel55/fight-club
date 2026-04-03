import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSendFeedback } from "./useSendFeedback";
import * as feedbackService from "../services/feedback.service";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useSendFeedback", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("on success, invalidates feedback query for the enrollment", async () => {
    vi.spyOn(feedbackService.feedbackService, "sendFeedback").mockResolvedValue(
      {
        id: "fb-1",
        content: "Nice work on the techniques!",
        teacher: { first_name: "Alice" },
        created_at: new Date().toISOString(),
      },
    );

    const { result } = renderHook(() => useSendFeedback("enr-1"), { wrapper });

    result.current.mutate({ content: "Nice work on the techniques!" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
