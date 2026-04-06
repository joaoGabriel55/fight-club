import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { ClassTipsDialog } from "./ClassTipsDialog";
import * as useClassTips from "../hooks/useClassTips";

vi.mock("../hooks/useClassTips", () => ({
  useClassTips: vi.fn(),
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

describe("ClassTipsDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useClassTips.useClassTips).mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      isPending: false,
      error: null,
      reset: vi.fn(),
    });
  });

  it("renders dialog with title and close button", () => {
    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={() => {}} />,
    );

    expect(screen.getByText("What Teach Today")).toBeDefined();
    expect(screen.getByText(/Get AI suggestions for Test Class/)).toBeDefined();
    expect(screen.getByRole("button", { name: /close/i })).toBeDefined();
  });

  it("shows warning message about qualified instructors", () => {
    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={() => {}} />,
    );

    expect(
      screen.getByText(/Always confirm these suggestions with qualified instructors/),
    ).toBeDefined();
  });

  it("shows focus area select dropdown", () => {
    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={() => {}} />,
    );

    expect(screen.getByText("Focus area")).toBeDefined();
  });

  it("shows Get Suggestions button enabled by default", () => {
    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={() => {}} />,
    );

    const button = screen.getByRole("button", { name: /get suggestions/i });
    expect(button).toBeDefined();
    expect(button).toBeEnabled();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={onClose} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows loading spinner when isPending is true", () => {
    vi.mocked(useClassTips.useClassTips).mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      isPending: true,
      error: null,
      reset: vi.fn(),
    });

    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={() => {}} />,
    );

    expect(screen.getAllByText(/Generating suggestions/)).toBeDefined();
  });

  it("shows error message when there is an error", () => {
    vi.mocked(useClassTips.useClassTips).mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      isPending: false,
      error: new Error("API Error"),
      reset: vi.fn(),
    });

    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={() => {}} />,
    );

    expect(screen.getByText("API Error")).toBeDefined();
  });

  it("shows tips when data is returned", () => {
    vi.mocked(useClassTips.useClassTips).mockReturnValue({
      mutate: vi.fn(),
      data: { tips: "**Practice your stance**\n- Keep knees bent" },
      isPending: false,
      error: null,
      reset: vi.fn(),
    });

    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={() => {}} />,
    );

    expect(screen.getByText(/Training suggestions for Test Class/)).toBeDefined();
  });

  it("shows Try Another button after receiving tips", async () => {
    vi.mocked(useClassTips.useClassTips).mockReturnValue({
      mutate: vi.fn(),
      data: { tips: "Some tips" },
      isPending: false,
      error: null,
      reset: vi.fn(),
    });

    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={() => {}} />,
    );

    const tryAnotherButton = screen.getByRole("button", { name: /try another/i });
    expect(tryAnotherButton).toBeDefined();
  });

  it("does not show focus area select when tips are displayed", () => {
    vi.mocked(useClassTips.useClassTips).mockReturnValue({
      mutate: vi.fn(),
      data: { tips: "Some tips" },
      isPending: false,
      error: null,
      reset: vi.fn(),
    });

    renderWithQuery(
      <ClassTipsDialog classId="1" className="Test Class" onClose={() => {}} />,
    );

    expect(screen.queryByText("Focus area")).toBeNull();
  });
});
