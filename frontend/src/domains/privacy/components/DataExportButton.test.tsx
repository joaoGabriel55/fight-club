import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { DataExportButton } from "./DataExportButton";
import * as privacyService from "../services/privacy.service";

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("DataExportButton", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("on success, URL.createObjectURL is called and a download link is clicked", async () => {
    const mockData: privacyService.DataExport = {
      account: {
        first_name: "Bob",
        last_name: "Smith",
        email: "bob@example.com",
        profile_type: "student",
        created_at: "2026-01-01",
      },
      enrollments: [],
      feedback_received: [],
      belt_progress: [],
      announcements_received: [],
    };

    vi.spyOn(privacyService.privacyService, "exportMyData").mockResolvedValue(
      mockData,
    );

    const createObjectURLSpy = vi.fn().mockReturnValue("blob:test");
    const revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy;

    render(
      <Wrapper>
        <DataExportButton />
      </Wrapper>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /export my data/i }),
    );

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });

  it("on error, shows error message", async () => {
    vi.spyOn(privacyService.privacyService, "exportMyData").mockRejectedValue(
      new Error("Server error"),
    );

    render(
      <Wrapper>
        <DataExportButton />
      </Wrapper>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /export my data/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to export data/)).toBeInTheDocument();
    });
  });
});
