import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when open=false", () => {
    render(
      <ConfirmDialog
        open={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm"
        description="Are you sure?"
      />,
    );
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("renders when open=true", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm"
        description="Are you sure?"
      />,
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("renders custom confirm and cancel labels", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete"
        description="Delete this item?"
        confirmLabel="Delete Item"
        cancelLabel="Keep"
      />,
    );
    expect(screen.getByText("Delete Item")).toBeInTheDocument();
    expect(screen.getByText("Keep")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirm"
        description="Proceed?"
      />,
    );

    const buttons = screen.getAllByRole("button");
    const confirmButton = buttons.find(b => b.textContent === "Confirm");
    fireEvent.click(confirmButton!);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button clicked", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirm"
        description="Proceed?"
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows loading state when loading=true", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm"
        description="Proceed?"
        loading={true}
      />,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
