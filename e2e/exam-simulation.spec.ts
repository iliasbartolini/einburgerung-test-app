import { test, expect } from '@playwright/test';
import { onboard, goToTab, resetProgress } from './helpers';

test('exam simulation: answer all 33 questions and submit', async ({ page }) => {
  await onboard(page);

  // Start Exam Simulation from Home
  await page.getByRole('button', { name: /Exam Simulation/i }).click();

  // Verify timer is visible
  await expect(page.getByText('Time Remaining')).toBeVisible();

  // Answer all 33 questions
  for (let i = 0; i < 33; i++) {
    await page.getByRole('radio').first().click();
    if (i < 32) {
      await page.getByText('Next', { exact: true }).click();
    }
  }

  // Submit exam
  await page.getByText('Submit Exam', { exact: true }).first().click();

  // Confirm in modal
  await expect(page.getByText('Are you sure you want to submit?')).toBeVisible();
  await page.getByText('Submit Exam', { exact: true }).last().click();

  // Verify results screen
  await expect(page.getByText(/Passed!|Not Passed/)).toBeVisible();
  await expect(page.getByText(/\/ 33/)).toBeVisible();
  await expect(page.getByText(/You need at least 17/)).toBeVisible();

  // Go back to Home via the button on the results screen
  await page.getByRole('tab', { name: 'Home' }).click();

  // Verify exam appears in Recent Exams
  await expect(page.getByText('Recent Exams')).toBeVisible();

  // Clean up
  await resetProgress(page);
});
