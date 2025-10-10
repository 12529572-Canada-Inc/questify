import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('App rendering', async () => {
  await setup({ browser: false }) // spins up Nuxt in test mode

  it('renders the index page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Welcome to Questify')
  })
})
