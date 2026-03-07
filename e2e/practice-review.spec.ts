import { test, expect } from '@playwright/test';
import { onboard, goToTab, resetProgress } from './helpers';

test('practice mode, review mistakes, and flashcards', async ({ page }) => {
  await onboard(page);

  // --- Practice Mode ---
  await page.getByRole('button', { name: /Practice Mode/i }).click();

  // Wait for question to load
  await expect(page.getByRole('radio').first()).toBeVisible();

  // Answer question 1: select first option (may or may not be correct)
  await page.getByRole('radio').first().click();
  // Verify feedback is shown
  await expect(page.getByText(/Correct!|Incorrect/)).toBeVisible();

  // Move to question 2
  await page.getByText('Next', { exact: true }).click();

  // Answer question 2: select second option (different from first to get variety)
  await page.getByRole('radio').nth(1).click();
  await expect(page.getByText(/Correct!|Incorrect/)).toBeVisible();

  // Navigate back to Home using page.goto to avoid route conflicts
  await page.goto('/');
  await expect(page.getByText('Questions Practiced')).toBeVisible();

  // --- Verify Readiness Dashboard ---
  // Questions Practiced should show a non-zero value (we answered 2 questions)

  // --- Review Mistakes ---
  await page.getByRole('button', { name: /Review Mistakes/i }).click();

  // Wait for either questions to load (radio buttons) or "No mistakes" empty state
  await expect(
    page.getByRole('radio').first().or(page.getByText(/No mistakes to review/))
  ).toBeVisible();

  const hasMistakes = await page.getByRole('radio').first().isVisible();
  if (hasMistakes) {
    // Answer the review question
    await page.getByRole('radio').first().click();
    await expect(page.getByText(/Correct!|Incorrect/)).toBeVisible();
  }

  // Navigate back to Home
  await page.goto('/');
  await expect(page.getByText('Questions Practiced')).toBeVisible();

  // --- Flashcards ---
  await page.getByRole('button', { name: /Review Difficult Words/i }).click();

  // Should show empty state (no words saved yet)
  await expect(page.getByText('No Flash Cards Yet')).toBeVisible();

  // Go back
  await page.getByText('OK', { exact: true }).click();

  // Navigate to Home and clean up
  await page.goto('/');
  await resetProgress(page);
});
