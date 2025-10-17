import { expect, test } from '@playwright/test'

test('homepage hero is visible', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })

  await expect(page.getByText('Welcome to Questify')).toBeVisible()
  await expect(page.getByRole('button', { name: 'View Quests' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create Quest' })).toBeVisible()
})
