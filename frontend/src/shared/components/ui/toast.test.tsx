import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ToastProvider, useToast } from "./toast";

function TestComponent() {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast("Test message", "error")}>
      Show toast
    </button>
  );
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders toast when showToast is called", async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await act(async () => {
      screen.getByText("Show toast").click();
    });

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("auto-dismisses after 5000ms", async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await act(async () => {
      screen.getByText("Show toast").click();
    });

    expect(screen.getByText("Test message")).toBeInTheDocument();

    // Fast-forward past auto-dismiss time
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });
});
