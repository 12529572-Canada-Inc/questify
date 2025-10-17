import { expect, test } from '@playwright/test'

test('Home loads correctly', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })

  await expect(page.getByText('Welcome to Questify')).toBeVisible()
  await expect(page.getByRole('button', { name: 'View Quests' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create Quest' })).toBeVisible()
})

// import { expect, test } from '@nuxt/test-utils/playwright'

// test('test', async ({ page, goto }) => {
//   await goto('/', { waitUntil: 'hydration' })
//   await expect(page.getByText('My Test App')).toBeVisible()
// })
