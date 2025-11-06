import { expect, test } from '@playwright/test'

test.describe('Profile page navigation', () => {
  test('redirects unauthenticated visitors to login', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
