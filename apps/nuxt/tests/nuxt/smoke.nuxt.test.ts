// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HomeHeroCard from '~/components/home/HomeHeroCard.vue'

describe('Nuxt app boot', () => {
  it('mounts a component successfully', async () => {
    const wrapper = await mountSuspended(HomeHeroCard)
    expect(wrapper.exists()).toBe(true)
  })
})
