import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AwardBeltForm } from "./AwardBeltForm";
import * as beltsService from "../services/belts.service";

function renderForm(props: { hasBeltSystem?: boolean } = {}) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <AwardBeltForm enrollmentId="enr-1" />
    </QueryClientProvider>,
  );
}

describe("AwardBeltForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("validates belt_name not empty", async () => {
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /award belt/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/belt name is required/i),
      ).toBeInTheDocument();
    });
  });

  it("valid form calls useAwardBelt mutation", async () => {
    const spy = vi
      .spyOn(beltsService.beltsService, "awardBelt")
      .mockResolvedValue({
        id: "belt-1",
        belt_name: "Blue",
        awarded_at: "2024-06-01",
        awarded_by: { first_name: "Sensei" },
      });

    renderForm();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByRole("combobox"), "Blue");
    await user.click(screen.getByRole("button", { name: /award belt/i }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("enr-1", expect.objectContaining({
        belt_name: "Blue",
      }));
    });
  });
});
