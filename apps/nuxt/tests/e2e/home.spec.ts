import { expect, test } from '@playwright/test'

test('Home loads correctly', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Welcome to Questify')).toBeVisible()
  await expect(page.getByRole('link', { name: 'View Quests' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Quest' })).toBeVisible()
})
