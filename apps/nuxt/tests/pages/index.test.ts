import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineAsyncComponent } from 'vue'

describe('Index Page', () => {
  it('renders properly', async () => {
    const component = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/index.vue')),
    )
    expect(component.html()).toContain('Welcome')
  })
})
