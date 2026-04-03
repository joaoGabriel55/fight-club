import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentDialog } from "./ConsentDialog";

function renderDialog(
  overrides: Partial<Parameters<typeof ConsentDialog>[0]> = {},
) {
  const props = {
    className: "Brazilian Jiu-Jitsu",
    teacherFirstName: "Alice",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    isPending: false,
    ...overrides,
  };
  render(<ConsentDialog {...props} />);
  return props;
}

describe("ConsentDialog", () => {
  it("renders the class name and teacher name", () => {
    renderDialog();
    expect(screen.getByText(/Brazilian Jiu-Jitsu/)).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("Confirm button is disabled when checkbox is unchecked", () => {
    renderDialog();
    const confirmBtn = screen.getByRole("button", { name: /join class/i });
    expect(confirmBtn).toBeDisabled();
  });

  it("Confirm button is enabled after checking the checkbox", async () => {
    renderDialog();
    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    const confirmBtn = screen.getByRole("button", { name: /join class/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("clicking Confirm calls onConfirm", async () => {
    const { onConfirm } = renderDialog();
    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    await userEvent.click(screen.getByRole("button", { name: /join class/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("clicking Cancel does not call onConfirm", async () => {
    const { onConfirm, onCancel } = renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("Confirm button is disabled when isPending is true even if checkbox checked", async () => {
    renderDialog({ isPending: true });
    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    const confirmBtn = screen.getByRole("button", { name: /joining/i });
    expect(confirmBtn).toBeDisabled();
  });
});
