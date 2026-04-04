import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ImprovementTipsDialog } from "./ImprovementTipsDialog";
import * as aiService from "../services/ai.service";

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function renderDialog(
  overrides: Partial<Parameters<typeof ImprovementTipsDialog>[0]> = {},
) {
  const props = {
    feedbackId: "fb-1",
    martialArt: "Brazilian Jiu-Jitsu",
    onClose: vi.fn(),
    ...overrides,
  };
  render(
    <Wrapper>
      <ImprovementTipsDialog {...props} />
    </Wrapper>,
  );
  return props;
}

describe("ImprovementTipsDialog", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders with focus area dropdown and no free-text input", () => {
    renderDialog();

    expect(screen.getByText("AI Training Tips")).toBeInTheDocument();
    expect(screen.getByText("Brazilian Jiu-Jitsu")).toBeInTheDocument();

    // No free text input fields
    const textInputs = document.querySelectorAll(
      'input[type="text"], textarea',
    );
    expect(textInputs.length).toBe(0);
  });

  it("shows disclaimer banner", () => {
    renderDialog();
    expect(
      screen.getByText(/Always confirm these tips with your Teacher\/Sensei/),
    ).toBeInTheDocument();
  });

  it("'Get Tips' click calls AI service", async () => {
    const spy = vi
      .spyOn(aiService.aiService, "getImprovementTips")
      .mockResolvedValue({ tips: "1. Practice more guard passing." });

    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: /get tips/i }));

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({
        feedback_id: "fb-1",
        focus_area: undefined,
      }),
    );
  });

  it("on success, tips displayed with disclaimer", async () => {
    vi.spyOn(aiService.aiService, "getImprovementTips").mockResolvedValue({
      tips: "1. Work on hip escapes.\n2. Drill takedowns daily.",
    });

    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: /get tips/i }));

    await waitFor(() => {
      expect(screen.getByText(/Work on hip escapes/)).toBeInTheDocument();
    });

    // Disclaimer should still be visible
    expect(
      screen.getByText(/Always confirm these tips with your Teacher\/Sensei/),
    ).toBeInTheDocument();
  });

  it("on error, shows inline error message", async () => {
    vi.spyOn(aiService.aiService, "getImprovementTips").mockRejectedValue(
      new Error("AI service not available"),
    );

    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: /get tips/i }));

    await waitFor(() => {
      expect(screen.getByText(/AI service not available/)).toBeInTheDocument();
    });
  });

  it("loading spinner visible during request", async () => {
    let resolvePromise: (value: { tips: string }) => void;
    vi.spyOn(aiService.aiService, "getImprovementTips").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: /get tips/i }));

    expect(screen.getByText("Generating tips...")).toBeInTheDocument();

    resolvePromise!({ tips: "1. Tips here." });

    await waitFor(() => {
      expect(screen.getByText(/Tips here/)).toBeInTheDocument();
    });
  });

  it("close button calls onClose", async () => {
    const props = renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(props.onClose).toHaveBeenCalled();
  });
});
