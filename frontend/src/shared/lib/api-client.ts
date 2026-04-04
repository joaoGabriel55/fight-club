/**
 * API client for Fight Club.
 *
 * Token storage:
 *   - The auth token is set as an httpOnly cookie by the backend on login/register.
 *   - The browser sends it automatically on every request via `credentials: 'include'`.
 *   - Token never touches JS storage (localStorage/sessionStorage) — XSS-proof.
 *   - _token is an in-memory copy used to attach the Authorization header within
 *     the same page session (after login/register); on reload it is null and the
 *     cookie carries the session on its own.
 *   - _authenticated tracks whether the session has been confirmed (either by a
 *     successful login/register or by a GET /me call in the route guard).
 *   - Cleared on 401 response, then the user is redirected to /login.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "";

// ─── Auth state ───────────────────────────────────────────────────────────────
let _token: string | null = null;
let _authenticated = false;

export function setToken(token: string): void {
  _token = token;
  _authenticated = true;
}

export function clearToken(): void {
  _token = null;
  _authenticated = false;
}

export function getToken(): string | null {
  return _token;
}

/** True when the session has been confirmed (login, register, or /me check). */
export function isAuthenticated(): boolean {
  return _authenticated;
}

/** Mark the session as confirmed without storing a token (used after /me validates the cookie). */
export function markAuthenticated(): void {
  _authenticated = true;
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
  /** If true, do not redirect to /login on 401 (useful for auth probes) */
  suppressRedirect?: boolean;
}

export async function apiClient<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    unauthenticated = false,
    suppressRedirect = false,
    ...fetchOptions
  } = options;

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

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
      credentials: "include", // send httpOnly auth cookie on every request
    });
  } catch {
    import("@/shared/components/ui/toast")
      .then(({ showToast }) => {
        showToast("Connection error. Please check your internet.", "error");
      })
      .catch(() => {});
    throw new ApiError(0, "Network error");
  }

  if (response.status === 401) {
    clearToken();
    if (!suppressRedirect) {
      if (_navigateTo) {
        _navigateTo("/login");
      } else {
        window.location.href = "/login";
      }
    }
    throw new ApiError(401, "Unauthorized", undefined);
  }

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ error: { message: response.statusText } }));
    const message = body?.error?.message ?? response.statusText;
    // Import showToast dynamically to avoid circular dependency
    import("@/shared/components/ui/toast")
      .then(({ showToast }) => {
        showToast(message, "error");
      })
      .catch(() => {});
    throw new ApiError(response.status, message, body);
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
