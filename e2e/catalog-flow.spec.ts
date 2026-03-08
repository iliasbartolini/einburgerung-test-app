import { test, expect } from '@playwright/test';
import { onboard, goToTab, resetProgress } from './helpers';

test('catalog: filter, search, and answer question', async ({ page }) => {
  await onboard(page);

  // Navigate to Catalog tab
  await goToTab(page, 'Catalog');

  // --- Verify catalog loads ---
  // All filter shows 310 questions (300 general + 10 Berlin state)
  await expect(page.getByText(/Showing 310 of 310 questions/)).toBeVisible();

  // --- Filter by topic ---
  // Tap "Politics" filter chip — should show 100 of 310
  await page.getByText('Politics', { exact: true }).click();
  await expect(page.getByText(/Showing 100 of 310 questions/)).toBeVisible();

  // Tap "Society" filter chip — also 100, but verifies filter switching works
  await page.getByText('Society', { exact: true }).click();
  await expect(page.getByText(/Showing 100 of 310 questions/)).toBeVisible();

  // Tap "State" filter chip — should show 10 Berlin state questions
  await page.getByText('State', { exact: true }).click();
  await expect(page.getByText(/Showing 10 of 310 questions/)).toBeVisible();

  // Tap "All" to reset
  await page.getByText('All', { exact: true }).click();
  await expect(page.getByText(/Showing 310 of 310 questions/)).toBeVisible();

  // --- Filter by status ---
  // Tap "Unanswered" filter chip — all 310 should be unanswered
  await page.getByText('Unanswered', { exact: true }).click();
  await expect(page.getByText(/Showing 310 of 310 questions/)).toBeVisible();

  // Reset to All
  await page.getByText('All', { exact: true }).click();

  // --- Search ---
  const searchBox = page.getByPlaceholder('Search questions...');
  await searchBox.fill('Deutschland');
  // Wait for search results to narrow down
  await expect(page.getByText(/Showing \d+ of \d+ questions/)).toBeVisible();
  // Verify results narrowed (should not be full 310)
  await expect(page.getByText(/Showing 310 of 310 questions/)).not.toBeVisible();

  // Clear search
  await searchBox.fill('');
  await expect(page.getByText(/Showing 310 of 310 questions/)).toBeVisible();

  // --- Open question detail ---
  // Click on the first question in the list
  await page.getByRole('button').first().click();

  // Verify QuestionCard is shown - radio options should be visible
  await expect(page.getByRole('radio').first()).toBeVisible();

  // Answer the question
  await page.getByRole('radio').first().click();
  await expect(page.getByText(/ Correct!| Incorrect/)).toBeVisible();

  // --- Bookmark the question ---
  await page.getByRole('button', { name: 'Add bookmark' }).click();
  // Verify bookmark toggled (button label changes)
  await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible();

  // Navigate back to catalog
  await goToTab(page, 'Catalog');

  // --- Verify bookmarked filter shows the bookmarked question ---
  await page.getByText('Bookmarked', { exact: true }).click();
  await expect(page.getByText(/Showing 1 of 310 questions/)).toBeVisible();

  // Reset to All before checking unanswered
  await page.getByText('All', { exact: true }).click();

  // --- Verify answered question reflected in filters ---
  await page.getByText('Unanswered', { exact: true }).click();
  await expect(page.getByText(/Showing 309 of 310 questions/)).toBeVisible();

  // Clean up
  await goToTab(page, 'Home');
  await resetProgress(page);
});
