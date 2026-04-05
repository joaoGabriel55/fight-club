import { test, expect } from "@playwright/test";
import { API_URL, registerViaAPI, loginUI, fetchWithRetry } from "./helpers";

const ts = Date.now();

const TEACHER = {
  email: `teacher-auth-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherAuth",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

test.describe("Auth: Full Teacher Flow", () => {
  test.describe.configure({ mode: "serial" });

  let classId: string;
  let inviteToken: string;

  test("Teacher registers via UI", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByLabel("First name").fill(TEACHER.first_name);
    await page.getByLabel("Last name").fill("AuthTest");
    await page.getByLabel("Email").fill(TEACHER.email);
    await page.getByLabel("Password").fill(TEACHER.password);

    // Select date of birth
    await page.getByText("Select date").click();
    await page.getByRole("gridcell", { name: "15" }).first().click();

    await page.getByRole("radio", { name: "Teacher" }).check();
    await page.getByRole("checkbox").first().check();

    await page.getByRole("button", { name: /Create account/i }).click();

    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.getByText("TeacherAuth")).toBeVisible({ timeout: 10000 });
  });

  test("Teacher creates a class with 2 schedules", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/classes/new");
    await expect(
      page.getByRole("heading", { name: "Create Class" }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByLabel("Class name").fill("Auth E2E Class");
    await page.getByLabel("Martial art").fill("Karate");

    // Add first schedule
    await page.getByRole("button", { name: /Add schedule/i }).click();
    await expect(page.getByText("Schedule 1")).toBeVisible();

    // Add second schedule
    await page.getByRole("button", { name: /Add schedule/i }).click();
    await expect(page.getByText("Schedule 2")).toBeVisible();

    await page.getByRole("button", { name: "Create class" }).click();

    await page.waitForURL(/\/classes\/[a-f0-9-]+/, { timeout: 10000 });

    // Extract classId from URL
    const url = page.url();
    const match = url.match(/\/classes\/([a-f0-9-]+)/);
    expect(match).toBeTruthy();
    classId = match![1];
  });

  test("Teacher generates invite link and copies URL", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto(`/classes/${classId}/invitations`);
    await expect(page.getByRole("link", { name: "Invite links" })).toBeVisible({
      timeout: 10000,
    });

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
    expect(inviteToken).toBeTruthy();
  });
});
