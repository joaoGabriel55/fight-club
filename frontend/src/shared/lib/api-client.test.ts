import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  apiClient,
  setToken,
  clearToken,
  getToken,
  setNavigateFn,
  ApiError,
} from "./api-client";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("apiClient", () => {
  beforeEach(() => {
    clearToken();
    mockFetch.mockReset();
    // Reset import.meta.env
    vi.stubEnv("VITE_API_URL", "http://localhost:3333");
  });

  it("includes Authorization header when token is set", async () => {
    setToken("test-token-abc");
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await apiClient("/health");

    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer test-token-abc");
  });

  it("does not include Authorization header after clearToken()", async () => {
    setToken("will-be-cleared");
    clearToken();

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await apiClient("/health");

    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("does not write token to localStorage or sessionStorage", () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    setToken("sensitive-token");
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("getToken returns the token after setToken", () => {
    setToken("my-token");
    expect(getToken()).toBe("my-token");
  });

  it("getToken returns null after clearToken", () => {
    setToken("my-token");
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("clears token and navigates to /login on 401", async () => {
    setToken("expired-token");
    const navigateMock = vi.fn();
    setNavigateFn(navigateMock);

    mockFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(apiClient("/protected")).rejects.toThrow("Unauthorized");

    expect(getToken()).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("throws ApiError with status on non-2xx response", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Not found" } }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    let caughtError: unknown;
    try {
      await apiClient("/missing");
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).toBeInstanceOf(ApiError);
    expect((caughtError as ApiError).status).toBe(404);
  });
});
