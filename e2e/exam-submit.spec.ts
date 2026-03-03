import { test, expect } from '@playwright/test';

test('onboarding → exam → answer 2 questions → submit', async ({ page }) => {
  // Navigate to app - should redirect to onboarding
  await page.goto('/');

  // --- Onboarding: Welcome / Language selection ---
  await expect(page.getByText('Einbürgerungstest')).toBeVisible();
  await page.getByRole('button', { name: /English/i }).click();

  // --- Onboarding: Bundesland selection ---
  await expect(page.getByText('Select your Bundesland')).toBeVisible();
  await page.getByRole('radio', { name: 'Berlin' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- Main app: home screen should show after onboarding ---
  await expect(page.getByText('Practice', { exact: true })).toBeVisible();

  // --- Start Exam Simulation from Home screen ---
  await page.getByRole('button', { name: /Exam Simulation/i }).click();

  // --- Exam: answer question 1 ---
  await expect(page.getByText('Time Remaining')).toBeVisible();
  await page.getByRole('radio').first().click();

  // Move to question 2
  await page.getByText('Next', { exact: true }).click();

  // --- Exam: answer question 2 ---
  await page.getByRole('radio').first().click();

  // --- Submit exam ---
  await page.getByText('Submit Exam', { exact: true }).click();

  // Confirm in the modal dialog
  await expect(page.getByText('Are you sure you want to submit?')).toBeVisible();
  // The modal confirm button is the last "Submit Exam" text on the page
  await page.getByText('Submit Exam', { exact: true }).last().click();

  // --- Results screen ---
  await expect(page.getByText(/Passed!|Not Passed/)).toBeVisible();
  await expect(page.getByText(/You need at least 17/)).toBeVisible();
});
