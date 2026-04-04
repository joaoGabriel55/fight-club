import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Modal } from "./modal";

describe("Modal", () => {
  it("does not render when open=false", () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <p>Content</p>
      </Modal>,
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders when open=true", () => {
    render(
      <Modal open={true} onClose={() => {}}>
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("focuses first focusable element on open", () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        <button>First</button>
        <button>Second</button>
      </Modal>,
    );
    // The close button in the title area is the first focusable element
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Close");
  });

  it("calls onClose on ESC key press", async () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on backdrop click", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    // Click the overlay directly using fireEvent so target === overlay
    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});
