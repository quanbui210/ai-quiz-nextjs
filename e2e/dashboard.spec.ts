import { test, expect } from "@playwright/test"

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - set auth in localStorage
    await page.goto("/")
    await page.evaluate(() => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: {
              id: "test-id",
              email: "test@example.com",
              name: "Test User",
            },
            session: {
              access_token: "test-token",
            },
            isAuthenticated: true,
          },
        })
      )
    })
  })

  test("should display dashboard when authenticated", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })

  test("should display sidebar navigation", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Dashboard")).toBeVisible()
    await expect(page.getByText("All Topics")).toBeVisible()
    await expect(page.getByText("AI Tutor")).toBeVisible()
  })

  test("should display stats cards", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Overall Progress")).toBeVisible()
    await expect(page.getByText("Topics Mastered")).toBeVisible()
    await expect(page.getByText("Quizzes Taken")).toBeVisible()
  })
})
