/**
 * API client for Fight Club.
 *
 * Token storage:
 *   - Stored in-memory only (module-level variable).
 *   - NEVER written to localStorage, sessionStorage, or any persistent store.
 *   - Cleared on 401 response, then the user is redirected to /login.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "";

// ─── In-memory token store ────────────────────────────────────────────────────
let _token: string | null = null;

export function setToken(token: string): void {
  _token = token;
}

export function clearToken(): void {
  _token = null;
}

export function getToken(): string | null {
  return _token;
}

// ─── Navigation callback ──────────────────────────────────────────────────────
// Injected by the app's router so the api-client doesn't import the router
// directly (avoids circular deps and keeps this module framework-agnostic).
let _navigateTo: ((path: string) => void) | null = null;

export function setNavigateFn(fn: (path: string) => void): void {
  _navigateTo = fn;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

export interface ApiRequestOptions extends RequestInit {
  /** If true, do not automatically add Authorization header */
  unauthenticated?: boolean;
}

export async function apiClient<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { unauthenticated = false, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  if (
    !headers.has("Content-Type") &&
    !(fetchOptions.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (!unauthenticated && _token) {
    headers.set("Authorization", `Bearer ${_token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (_navigateTo) {
      _navigateTo("/login");
    } else {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized — redirecting to login");
  }

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ error: { message: response.statusText } }));
    throw new ApiError(
      response.status,
      body?.error?.message ?? response.statusText,
      body,
    );
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ─── Typed error ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
