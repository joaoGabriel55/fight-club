import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
} from "@tanstack/react-router";
import { ClassCard } from "./ClassCard";
import * as classesService from "../services/classes.service";

const mockCls = {
  id: "class-1",
  name: "BJJ Basics",
  martial_art: "BJJ",
  has_belt_system: true,
  description: "A grappling art",
  schedule_count: 2,
  enrollment_count: 5,
  created_at: new Date().toISOString(),
};

function renderCard() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const rootRoute = createRootRoute({
    component: () => createElement(ClassCard, { cls: mockCls }),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory(),
  });
  return render(
    createElement(
      QueryClientProvider,
      { client: qc },
      createElement(RouterProvider, { router }),
    ),
  );
}

describe("ClassCard", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders class name", async () => {
    renderCard();
    expect(await screen.findByText("BJJ Basics")).toBeInTheDocument();
  });

  it("renders martial art", async () => {
    renderCard();
    expect(await screen.findByText("BJJ")).toBeInTheDocument();
  });

  it("renders schedule count", async () => {
    renderCard();
    expect(await screen.findByText(/2 schedules/)).toBeInTheDocument();
  });

  it("shows confirmation prompt before calling delete mutation", async () => {
    const deleteSpy = vi
      .spyOn(classesService.classesService, "deleteClass")
      .mockResolvedValue(undefined);

    renderCard();

    // Click the trash icon button — should show confirmation, not call service yet
    // The trash button is the only <button> before confirmation mode
    const buttons = await screen.findAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(await screen.findByText(/Delete class\?/i)).toBeInTheDocument();
    expect(deleteSpy).not.toHaveBeenCalled();

    // Click "Yes, delete" — should call service
    fireEvent.click(screen.getByText(/Yes, delete/i));
    // Mutation is async; wait for it to be invoked
    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith("class-1"));
  });
});
