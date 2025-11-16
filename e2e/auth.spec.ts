import { test, expect } from "@playwright/test"

test.describe("Authentication Flow", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("should display login page", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByText("Welcome to LearnAI")).toBeVisible()
    await expect(
      page.getByRole("button", { name: /sign in with google/i })
    ).toBeVisible()
  })

  // Note: Full OAuth flow test would require mocking Google OAuth
  // This is a placeholder for when you want to test the full flow
  test.skip("should complete OAuth flow and redirect to dashboard", async ({
    page,
  }) => {
    // This test would require:
    // 1. Mocking Google OAuth
    // 2. Mocking the callback
    // 3. Verifying dashboard access
  })
})
