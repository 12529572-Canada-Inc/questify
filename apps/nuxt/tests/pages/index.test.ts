import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('Index Page', () => {
  it('renders properly', async () => {
    const component = await mountSuspended(() => import('~/pages/index.vue'))
    expect(component.html()).toContain('Welcome') // adjust text as needed
  })
})
