import { expect, test } from '@playwright/test';
import { onboard, resetProgress } from './helpers';

test('practice mode, review mistakes, and flashcards', async ({ page }) => {
  await onboard(page);

  // --- Practice Mode: answer 10 questions ---
  await page.getByRole('button', { name: /Practice Mode/i }).click();

  // Wait for first question to load
  await expect(page.getByRole('radio').first()).toBeVisible();

  let correctCount = 0;

  for (let i = 0; i < 10; i++) {
    // Answer by selecting first option
    await page.getByRole('radio').first().click();
    // Check feedback
    const feedback = page.getByText(/[✓✗] (?:Correct!|Incorrect)/);
    await expect(feedback).toBeVisible();
    const text = await feedback.textContent();
    if (text?.includes('Correct')) correctCount++;

    // Move to next question
    if (i < 9) {
      await page.getByText('Next', { exact: true }).click();
    }
  }

  // Navigate back to Home
  await page.goto('/');
  await expect(page.getByText('Questions Practiced')).toBeVisible();

  // --- Verify Home Dashboard values ---
  const accuracy = Math.round((correctCount / 10) * 100);
  const coverage = Math.round((10 / 310) * 100);

  // Readiness is shown inside the big circle
  await expect(page.getByText('Readiness')).toBeVisible();

  // Accuracy stat
  await expect(page.getByText(`${accuracy}%`).first()).toBeVisible();
  await expect(page.getByText('Accuracy')).toBeVisible();

  // Questions Practiced
  await expect(page.getByText('10', { exact: true })).toBeVisible();
  await expect(page.getByText('Questions Practiced')).toBeVisible();

  // Coverage
  await expect(page.getByText(`${coverage}%`).first()).toBeVisible();
  await expect(page.getByText('Coverage')).toBeVisible();

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
