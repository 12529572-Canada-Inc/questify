import { expect, test } from '@playwright/test'

test.describe('Mobile responsiveness', () => {
  test.use({ viewport: { width: 360, height: 780 } })

  test('header and home layout adapt on small screens', async ({ page }) => {
    await page.goto('/')

    const shareButton = page.getByRole('button', { name: 'Share Questify' })
    await expect(shareButton).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => {
      const width = window.innerWidth
      const docWidth = document.documentElement.scrollWidth
      return docWidth - width > 1
    })
    expect(hasHorizontalOverflow).toBeFalsy()

    await shareButton.click()
    const closeButton = page.getByTestId('share-dialog-close')
    await closeButton.waitFor({ state: 'visible' })
    await expect(closeButton).toBeVisible()
    const dialog = closeButton.locator('xpath=ancestor::*[@role="dialog"][1]')
    await expect(dialog).toBeVisible()

    const dialogFitsViewport = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return rect.width <= window.innerWidth + 1 && rect.height <= window.innerHeight + 1
    })
    expect(dialogFitsViewport).toBeTruthy()

    await closeButton.click()
  })

  test('auth login form stays usable on mobile', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()

    const emailField = page.getByLabel('Email')
    const passwordField = page.getByLabel('Password')
    await expect(emailField).toBeVisible()
    await expect(passwordField).toBeVisible()

    const formHasOverflow = await page.evaluate(() => {
      const width = window.innerWidth
      const docWidth = document.documentElement.scrollWidth
      return docWidth - width > 1
    })
    expect(formHasOverflow).toBeFalsy()

    const submitButton = page.getByRole('button', { name: /^Login$/ })
    await expect(submitButton).toBeVisible()

    const buttonFits = await submitButton.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return rect.right <= window.innerWidth + 1
    })
    expect(buttonFits).toBeTruthy()
  })
})
