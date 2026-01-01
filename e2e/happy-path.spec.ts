import { test, expect } from "@playwright/test";
import { join } from "path";

test.describe("Happy Path - Full App Navigation", () => {
  test("should upload zip file and navigate through all pages", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for the connection form to be visible
    await expect(page.getByRole("heading", { name: /Actual Budget 2025 Wrapped/i })).toBeVisible();
    await expect(page.getByText(/Upload your Actual Budget export/i)).toBeVisible();

    // Get the file input
    const fileInput = page.getByLabel("Budget Export File");
    await expect(fileInput).toBeVisible();

    // Get the path to the demo budget zip file
    const demoBudgetPath = join(process.cwd(), "demo-budget.zip");

    // Upload the file
    await fileInput.setInputFiles(demoBudgetPath);

    // Verify file is selected
    await expect(page.getByText(/Selected:/i)).toBeVisible();

    // Click the Load Budget button
    const loadButton = page.getByRole("button", { name: /Load Budget/i });
    await expect(loadButton).toBeVisible();
    await loadButton.click();

    // Wait for loading to complete (check for loading state first, then wait for it to disappear)
    const loadingText = page.getByText(/Loading your budget data/i);
    await loadingText.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
      // Loading might be too fast, continue
    });
    await loadingText.waitFor({ state: "hidden", timeout: 30000 }).catch(() => {
      // If it doesn't appear, that's fine - data might load quickly
    });

    // Wait for the intro page to appear
    await expect(page.locator("#intro-page")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("heading", { name: /Your \d{4} Budget/i })).toBeVisible();
    await expect(page.getByText(/Year in Review/i)).toBeVisible();

    // Define all page IDs in order
    const pageIds = [
      "intro-page",
      "savings-rate-page",
      "account-breakdown-page",
      "monthly-breakdown-page",
      "top-categories-page",
      "category-trends-page",
      "top-payees-page",
      "calendar-heatmap-page",
      "spending-velocity-page",
      "future-projection-page",
      "outro-page",
    ];

    // Navigate through all pages using the Next button
    for (let i = 0; i < pageIds.length; i++) {
      const currentPageId = pageIds[i];
      const isLastPage = i === pageIds.length - 1;

      // Verify current page is visible
      await expect(page.locator(`#${currentPageId}`)).toBeVisible({ timeout: 5000 });

      // Verify navigation progress indicator (format: "X / Y")
      const progressText = page.locator('[class*="progressText"]');
      if (await progressText.isVisible()) {
        const progressContent = await progressText.textContent();
        expect(progressContent).toMatch(/\d+\s*\/\s*\d+/);
      }

      // If not the last page, click Next button
      if (!isLastPage) {
        const nextButton = page.getByRole("button", { name: /Next/i });
        await expect(nextButton).toBeVisible();
        await expect(nextButton).toBeEnabled();

        // Click Next and wait for page transition
        await nextButton.click();

        // Wait for current page to disappear and next page to appear
        await expect(page.locator(`#${currentPageId}`)).not.toBeVisible({ timeout: 5000 });
        await expect(page.locator(`#${pageIds[i + 1]}`)).toBeVisible({ timeout: 5000 });
      }
    }

    // Verify we're on the final page (outro)
    await expect(page.locator("#outro-page")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Thanks for using Actual Budget!/i }),
    ).toBeVisible();

    // Verify the Next button is disabled on the last page
    const nextButton = page.getByRole("button", { name: /Next/i });
    await expect(nextButton).toBeDisabled();

    // Verify Previous button is still enabled
    const previousButton = page.getByRole("button", { name: /Previous/i });
    await expect(previousButton).toBeEnabled();

    // Test going back one page
    await previousButton.click();
    await expect(page.locator("#future-projection-page")).toBeVisible();
    await expect(page.locator("#outro-page")).not.toBeVisible();

    // Verify Next button is enabled again
    await expect(nextButton).toBeEnabled();
  });

  test("should handle keyboard navigation", async ({ page }) => {
    // Navigate and upload file (same as above)
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Actual Budget 2025 Wrapped/i })).toBeVisible();

    const fileInput = page.getByLabel("Budget Export File");
    const demoBudgetPath = join(process.cwd(), "demo-budget.zip");
    await fileInput.setInputFiles(demoBudgetPath);

    const loadButton = page.getByRole("button", { name: /Load Budget/i });
    await loadButton.click();

    // Wait for intro page
    await expect(page.locator("#intro-page")).toBeVisible({ timeout: 30000 });

    // Use arrow keys to navigate
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#savings-rate-page")).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#account-breakdown-page")).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#savings-rate-page")).toBeVisible({ timeout: 5000 });

    // Test that arrow keys don't go beyond boundaries
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#intro-page")).toBeVisible({ timeout: 5000 });

    // Try to go before first page (should stay on intro)
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#intro-page")).toBeVisible({ timeout: 5000 });
  });
});
