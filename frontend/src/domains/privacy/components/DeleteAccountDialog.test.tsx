import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import * as privacyService from "../services/privacy.service";
import * as apiClient from "@/shared/lib/api-client";

// Mock useRouter
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    navigate: vi.fn(),
  }),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("DeleteAccountDialog", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("confirm button disabled until user types 'DELETE'", async () => {
    render(
      <Wrapper>
        <DeleteAccountDialog />
      </Wrapper>,
    );

    // Open dialog
    await userEvent.click(
      screen.getByRole("button", { name: /delete my account/i }),
    );

    const confirmBtn = screen.getByRole("button", {
      name: /confirm deletion/i,
    });
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByPlaceholderText("Type DELETE");
    await userEvent.type(input, "DELET");
    expect(confirmBtn).toBeDisabled();

    await userEvent.type(input, "E");
    expect(confirmBtn).not.toBeDisabled();
  });

  it("on success, clearToken is called", async () => {
    vi.spyOn(privacyService.privacyService, "eraseMyData").mockResolvedValue(
      undefined,
    );
    const clearTokenSpy = vi.spyOn(apiClient, "clearToken");

    render(
      <Wrapper>
        <DeleteAccountDialog />
      </Wrapper>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /delete my account/i }),
    );

    const input = screen.getByPlaceholderText("Type DELETE");
    await userEvent.type(input, "DELETE");

    await userEvent.click(
      screen.getByRole("button", { name: /confirm deletion/i }),
    );

    await waitFor(() => {
      expect(clearTokenSpy).toHaveBeenCalled();
    });
  });
});
