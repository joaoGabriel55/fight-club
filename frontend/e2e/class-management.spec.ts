import { test, expect } from "@playwright/test";
import { registerViaAPI, loginUI } from "./helpers";

const ts = Date.now();

const TEACHER = {
  email: `teacher-cls-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherCls",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

test.describe("Class Management CRUD", () => {
  test.describe.configure({ mode: "serial" });

  let classId: string;

  test.beforeAll(async () => {
    await registerViaAPI(TEACHER);
  });

  test("Teacher creates a class", async ({ page }) => {
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/classes/new");
    await expect(
      page.getByRole("heading", { name: "Create Class" }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByLabel("Class name").fill("CRUD Test Class");
    await page.getByLabel("Martial art").fill("Muay Thai");
    await page.getByLabel(/Description/).fill("A class for CRUD testing");
    await page.getByLabel("This class uses a belt/rank system").check();

    // Add a schedule
    await page.getByRole("button", { name: /Add schedule/i }).click();
    await expect(page.getByText("Schedule 1")).toBeVisible();

    await page.getByRole("button", { name: "Create class" }).click();

    await page.waitForURL(/\/classes\/[a-f0-9-]+/, { timeout: 10000 });

    const url = page.url();
    const match = url.match(/\/classes\/([a-f0-9-]+)/);
    expect(match).toBeTruthy();
    classId = match![1];
  });

  test("Class appears in the list", async ({ context, page }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/classes");
    await expect(page.getByText("CRUD Test Class")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Muay Thai")).toBeVisible();
    await expect(page.getByText("Belt system")).toBeVisible();
  });

  test("Teacher views class detail with schedules tab", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto(`/classes/${classId}/schedules`);

    // Class name shown in detail header
    await expect(page.getByText("CRUD Test Class")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Muay Thai")).toBeVisible();

    // Schedule tab content
    await expect(
      page.getByRole("heading", { name: "Schedules" }),
    ).toBeVisible();
    // The default schedule day is Monday (day_of_week=1)
    await expect(page.getByText("Monday")).toBeVisible();
  });

  test("Teacher deletes the class", async ({ context, page }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/classes");
    await expect(page.getByText("CRUD Test Class")).toBeVisible({
      timeout: 10000,
    });

    // Click the delete (trash) button on the card
    const classCard = page
      .locator('[class*="flex flex-col"]')
      .filter({ hasText: "CRUD Test Class" });
    await classCard.locator("button").filter({ hasText: "" }).last().click();

    // Confirm deletion
    await expect(page.getByText("Delete class?")).toBeVisible();
    await page.getByRole("button", { name: "Yes, delete" }).click();

    // Class should disappear
    await expect(page.getByText("CRUD Test Class")).not.toBeVisible({
      timeout: 10000,
    });
  });
});
