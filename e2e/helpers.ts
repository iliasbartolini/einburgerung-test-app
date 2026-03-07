import { Page, expect } from '@playwright/test';

/**
 * Complete onboarding: select English language, then Berlin as Bundesland.
 */
export async function onboard(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Einbürgerungstest')).toBeVisible();
  await page.getByRole('button', { name: /English/i }).click();
  await expect(page.getByText('Select your Bundesland')).toBeVisible();
  await page.getByRole('radio', { name: 'Berlin' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Practice', { exact: true })).toBeVisible();
}

/**
 * Navigate to a specific tab by tapping its label in the tab bar.
 */
export async function goToTab(page: Page, tabName: 'Home' | 'Catalog' | 'Profile') {
  await page.getByRole('tab', { name: tabName }).click();
}

/**
 * Reset all progress via Profile tab: Delete All Progress + Clear Cache.
 */
export async function resetProgress(page: Page) {
  await goToTab(page, 'Profile');
  await expect(page.getByText('Delete All Progress')).toBeVisible();
  await page.getByText('Delete All Progress').click();
  // Confirm in modal
  await expect(page.getByText('Are you sure?')).toBeVisible();
  await page.getByText('Delete', { exact: true }).last().click();
  // Clear translation cache
  await page.getByText('Clear Cache').click();
}
