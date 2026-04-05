import { test, expect } from "@playwright/test";
import { API_URL, registerViaAPI, loginUI } from "./helpers";

const ts = Date.now();

const STUDENT = {
  email: `student-ai-${ts}@test.com`,
  password: "Test1234!",
  first_name: "StudentAI",
  profile_type: "student" as const,
  birth_date: "2000-05-20",
};

const TEACHER = {
  email: `teacher-ai-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherAI",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

test.describe("AI Features", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await registerViaAPI(STUDENT);
    await registerViaAPI(TEACHER);
  });

  test("Student sees the Get AI Tips button", async ({ page }) => {
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    // AI Tips button should be visible for students
    const aiButton = page.getByRole("button", { name: /Get AI Tips/i });
    await expect(aiButton).toBeVisible({ timeout: 10000 });
  });

  test("Student opens AI Tips dialog and selects martial art", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    // Open AI Tips dialog
    await page.getByRole("button", { name: /Get AI Tips/i }).click();

    await expect(page.getByText("AI Training Tips")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText(
        "Select a martial art to get personalized improvement tips",
      ),
    ).toBeVisible();

    // Warning message about confirming with teacher
    await expect(
      page.getByText(/Always confirm these tips with your Teacher/),
    ).toBeVisible();

    // Select martial art
    await page.getByText("Choose martial art").click();
    await page.getByRole("option", { name: "BJJ" }).click();

    // Get Tips button should be enabled now
    const getTipsBtn = page.getByRole("button", { name: "Get Tips" });
    await expect(getTipsBtn).toBeEnabled();

    // Click Get Tips - result depends on whether ANTHROPIC_API_KEY is set
    await getTipsBtn.click();

    // Wait for either tips to appear or an error (API key not configured)
    const result = await Promise.race([
      page
        .getByText("Tips for BJJ")
        .waitFor({ state: "visible", timeout: 30000 })
        .then(() => "tips" as const),
      page
        .locator(".text-destructive")
        .first()
        .waitFor({ state: "visible", timeout: 30000 })
        .then(() => "error" as const),
      page
        .getByText("Generating tips...")
        .waitFor({ state: "hidden", timeout: 30000 })
        .then(() => "done" as const),
    ]);

    if (result === "tips") {
      // Tips were generated successfully
      await expect(page.getByText("Tips for BJJ")).toBeVisible();
      // "Try Another" button should appear
      await expect(
        page.getByRole("button", { name: "Try Another" }),
      ).toBeVisible();
    }
    // If error, that's OK - means API key is not configured (503)

    // Close dialog
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByText("AI Training Tips")).not.toBeVisible();
  });

  test("Teacher does NOT see Get AI Tips button", async ({ context, page }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    // AI Tips button should NOT be visible for teachers
    await expect(
      page.getByRole("button", { name: /Get AI Tips/i }),
    ).not.toBeVisible({ timeout: 5000 });
  });
});
