import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose, DrawerFooter } from "./drawer";

describe("Drawer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when open=false", () => {
    render(
      <Drawer open={false}>
        <DrawerContent>Content</DrawerContent>
      </Drawer>,
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders when open=true", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>Content</DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders title and description", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Test Title</DrawerTitle>
          <DrawerDescription>Test Description</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders trigger button", () => {
    render(
      <Drawer>
        <DrawerTrigger asChild>
          <button>Open</button>
        </DrawerTrigger>
        <DrawerContent>Content</DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders footer content", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerFooter>Footer Content</DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });
});
