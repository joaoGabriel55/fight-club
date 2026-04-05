import type { Page } from "@playwright/test";

export const API_URL = process.env.E2E_API_URL || "http://localhost:3333";

/**
 * Fetch wrapper that retries on 429 (rate limit) with exponential backoff.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 5,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 && attempt < retries) {
      // Wait for rate limit window to reset (60s + buffer)
      await new Promise((r) => setTimeout(r, 62000));
      continue;
    }
    return res;
  }
  throw new Error("fetchWithRetry: exhausted retries");
}

export async function registerViaAPI(user: {
  email: string;
  password: string;
  first_name: string;
  profile_type: "teacher" | "student";
  birth_date: string;
}): Promise<string> {
  const res = await fetchWithRetry(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(`Register failed: ${res.status}`);
  const data = await res.json();
  return data.token as string;
}

export async function loginUI(page: Page, email: string, password: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Check if we got rate-limited or navigated to dashboard
    const result = await Promise.race([
      page
        .waitForURL("**/dashboard", { timeout: 10000 })
        .then(() => "ok" as const),
      page
        .getByRole("main")
        .getByText("Too many requests")
        .waitFor({ state: "visible", timeout: 10000 })
        .then(() => "rate_limited" as const),
    ]);

    if (result === "ok") return;

    // Rate limited — wait for the 1-minute window to reset
    await page.waitForTimeout(62000);
    // Reload to get past any rate limit state
    await page.goto("/login");
  }

  // Final attempt — let it fail naturally if still rate-limited
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}
