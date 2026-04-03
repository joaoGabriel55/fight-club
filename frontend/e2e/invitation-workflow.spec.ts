import { test, expect, type Page } from "@playwright/test";

const API_URL = process.env.E2E_API_URL || "http://localhost:3333";

const TEACHER = {
  email: `teacher-e2e-${Date.now()}@test.com`,
  password: "Test1234!",
  first_name: "TeacherE2E",
  profile_type: "teacher" as const,
};

const STUDENT = {
  email: `student-e2e-${Date.now()}@test.com`,
  password: "Test1234!",
  first_name: "StudentE2E",
  profile_type: "student" as const,
};

let inviteToken: string;

async function registerViaAPI(user: typeof TEACHER) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(`Register failed: ${res.status}`);
  const data = await res.json();
  return data.token as string;
}

async function loginUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe.serial("Invitation & Enrollment Workflow", () => {
  test.beforeAll(async () => {
    await registerViaAPI(TEACHER);
  });

  test("Teacher creates a class and generates one invite link", async ({
    page,
  }) => {
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    // Create class with a schedule
    await page.goto("/classes/new");
    await page.getByLabel("Class name").fill("E2E Test Class");
    await page.getByLabel("Martial art").fill("Boxing");
    await page.getByText("+ Add schedule").click();
    await page.getByRole("button", { name: "Create class" }).click();

    await page.waitForURL(/\/classes\/[a-f0-9-]+/, { timeout: 10000 });

    // Go to invitations tab
    await page.getByRole("link", { name: "Invite links" }).click();
    await page.waitForURL(/\/invitations/);

    // Generate invite link
    const generateBtn = page.getByRole("button", { name: /Generate link/i });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();
    await page.getByRole("button", { name: /^Generate$/ }).click();

    // Wait for invite link to appear
    const inviteLinkText = page
      .locator(".font-mono")
      .filter({ hasText: "/join/" });
    await expect(inviteLinkText.first()).toBeVisible({ timeout: 10000 });

    // Extract token
    const urlText = await inviteLinkText.first().textContent();
    const match = urlText!.match(/\/join\/([a-f0-9-]+)/);
    expect(match).toBeTruthy();
    inviteToken = match![1];

    // Generate button should now be hidden (one link per class)
    await expect(
      page.getByRole("button", { name: /Generate link/i }),
    ).not.toBeVisible();
  });

  test("Unauthenticated user sees register/login on join page", async ({
    context,
    page,
  }) => {
    await context.clearCookies();

    await page.goto(`/join/${inviteToken}`);

    await expect(page.getByText("You've been invited to join")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("E2E Test Class")).toBeVisible();

    // Verify register link has redirect param
    const registerLink = page.getByRole("link", { name: "Register" });
    await expect(registerLink).toBeVisible();
    const href = await registerLink.getAttribute("href");
    expect(href).toContain("/register");
    expect(href).toContain("redirect=");
  });

  test("Student registers, is redirected to join page, and joins class", async ({
    context,
    page,
  }) => {
    await context.clearCookies();

    // Navigate directly to register with redirect param
    const redirectUrl = encodeURIComponent(`/join/${inviteToken}`);
    await page.goto(`/register?redirect=${redirectUrl}`);

    await expect(page.getByText("Join Fight Club")).toBeVisible({
      timeout: 10000,
    });

    // Fill registration form
    await page.getByLabel("First name").fill(STUDENT.first_name);
    await page.getByLabel("Last name").fill("E2ETest");
    await page.getByLabel("Email").fill(STUDENT.email);
    await page.getByLabel("Password").fill(STUDENT.password);
    await page.getByRole("radio", { name: "Student" }).check();
    await page.getByRole("checkbox").first().check();

    await page.getByRole("button", { name: /Create account/i }).click();

    // Should redirect back to /join/:token
    await page.waitForURL(`**/join/${inviteToken}`, { timeout: 15000 });

    // Should see ConsentDialog for joining the class
    await expect(page.getByText("Join E2E Test Class")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("I understand and consent")).toBeVisible();

    // Check consent checkbox and join
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Join class" }).click();

    // Join button should disappear after successful join
    await expect(
      page.getByRole("button", { name: "Join class" }),
    ).not.toBeVisible({ timeout: 10000 });
  });

  test("Teacher cannot generate a second invite link", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/classes");
    await page.getByText("E2E Test Class").click();
    await page.waitForURL(/\/classes\/[a-f0-9-]+/);

    await page.getByRole("link", { name: "Invite links" }).click();
    await page.waitForURL(/\/invitations/);

    // Generate button should NOT be visible
    await expect(
      page.getByRole("button", { name: /Generate link/i }),
    ).not.toBeVisible();

    // Existing invite card should be visible
    const inviteLinkText = page
      .locator(".font-mono")
      .filter({ hasText: "/join/" });
    await expect(inviteLinkText.first()).toBeVisible();
  });
});
