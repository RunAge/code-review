import { expect, test } from "@playwright/test";

test("review page renders", async ({ page }) => {
  await page.goto("/review");

  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
});

test("auth login page renders PAT fallback", async ({ page }) => {
  await page.goto("/auth/login");

  await expect(page.getByText("Personal Access Token")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with GitHub OAuth" })).toBeVisible();
});
