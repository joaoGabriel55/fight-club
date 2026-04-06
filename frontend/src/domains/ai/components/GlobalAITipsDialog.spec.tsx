import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { GlobalAITipsDialog } from "./GlobalAITipsDialog";
import * as useImprovementTips from "../hooks/useImprovementTips";

vi.mock("../hooks/useImprovementTips", () => ({
  useImprovementTips: vi.fn(),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("GlobalAITipsDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useImprovementTips.useImprovementTips).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      data: undefined,
      error: null,
      reset: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      status: "idle",
      variables: undefined,
      cancel: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });
  });

  it("renders dialog with title and close button", () => {
    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    expect(screen.getByText("AI Training Tips")).toBeDefined();
    expect(
      screen.getByText(/Select a martial art to get personalized improvement tips/),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /close/i })).toBeDefined();
  });

  it("shows warning message about Teacher/Sensei", () => {
    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    expect(
      screen.getByText(/Always confirm these tips with your Teacher\/Sensei/),
    ).toBeDefined();
  });

  it("shows martial art and focus area selects", () => {
    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    expect(screen.getByText("Select martial art")).toBeDefined();
    expect(screen.getByText("Focus area (optional)")).toBeDefined();
  });

  it("disables Get Tips button when no martial art selected", () => {
    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    const button = screen.getByRole("button", { name: /get tips/i });
    expect(button).toBeDefined();
    expect(button).toBeDisabled();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    renderWithQuery(<GlobalAITipsDialog onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows loading spinner when isPending is true", () => {
    vi.mocked(useImprovementTips.useImprovementTips).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      data: undefined,
      error: null,
      reset: vi.fn(),
      isPending: true,
      isError: false,
      isSuccess: false,
      isIdle: false,
      status: "pending",
      variables: { martial_art: "boxing", focus_area: "Striking technique" },
      cancel: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });

    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    expect(screen.getAllByText(/Generating tips/)).toBeDefined();
  });

  it("shows error message when there is an error", () => {
    vi.mocked(useImprovementTips.useImprovementTips).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      data: undefined,
      error: new Error("API Error"),
      reset: vi.fn(),
      isPending: false,
      isError: true,
      isSuccess: false,
      isIdle: false,
      status: "error",
      variables: { martial_art: "boxing", focus_area: "Striking technique" },
      cancel: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });

    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    expect(screen.getByText("API Error")).toBeDefined();
  });

  it("shows tips when data is returned", () => {
    vi.mocked(useImprovementTips.useImprovementTips).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      data: { tips: "**Focus on your footwork**\n- Keep your guard up" },
      error: null,
      reset: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      status: "success",
      variables: { martial_art: "boxing", focus_area: "Striking technique" },
      cancel: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });

    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    expect(screen.getByText("Focus on your footwork")).toBeDefined();
  });

  it("shows Try Another button after receiving tips", async () => {
    vi.mocked(useImprovementTips.useImprovementTips).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      data: { tips: "Some tips" },
      error: null,
      reset: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      status: "success",
      variables: { martial_art: "boxing", focus_area: "Striking technique" },
      cancel: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });

    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    const tryAnotherButton = screen.getByRole("button", { name: /try another/i });
    expect(tryAnotherButton).toBeDefined();
  });

  it("does not show selects when tips are displayed", () => {
    vi.mocked(useImprovementTips.useImprovementTips).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      data: { tips: "Some tips" },
      error: null,
      reset: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      status: "success",
      variables: { martial_art: "boxing", focus_area: "Striking technique" },
      cancel: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });

    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    expect(screen.queryByText("Select martial art")).toBeNull();
    expect(screen.queryByText("Focus area (optional)")).toBeNull();
  });

  it("shows error message with custom error message", () => {
    vi.mocked(useImprovementTips.useImprovementTips).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      data: undefined,
      error: new Error("Rate limit exceeded"),
      reset: vi.fn(),
      isPending: false,
      isError: true,
      isSuccess: false,
      isIdle: false,
      status: "error",
      variables: { martial_art: "boxing", focus_area: "Striking technique" },
      cancel: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });

    renderWithQuery(<GlobalAITipsDialog onClose={() => {}} />);

    expect(screen.getByText("Rate limit exceeded")).toBeDefined();
  });
});
