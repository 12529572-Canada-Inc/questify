import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'
import { setupTest, url } from '@nuxt/test-utils/e2e'

await setupTest({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  browser: true,
})

test('home page shows the hero actions', async ({ page }) => {
  await page.goto(url('/'))

  await expect(page.getByText('Welcome to Questify')).toBeVisible()
  await expect(page.getByText('Create and track your quests powered by AI.')).toBeVisible()

  const viewQuestsLink = page.locator('a:has-text("View Quests")')
  await expect(viewQuestsLink).toBeVisible()
  await expect(viewQuestsLink).toHaveAttribute('href', '/quests')

  const createQuestLink = page.locator('a:has-text("Create Quest")')
  await expect(createQuestLink).toBeVisible()
  await expect(createQuestLink).toHaveAttribute('href', '/quests/new')
})
