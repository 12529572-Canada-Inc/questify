// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HomeHeroCard from '~/components/home/HomeHeroCard.vue'

describe('HomeHeroCard', () => {
  it('renders the hero title and tagline', async () => {
    const wrapper = await mountSuspended(HomeHeroCard)

    // ✅ Headline
    expect(wrapper.text()).toContain('Welcome to Questify')

    // ✅ Subtitle / tagline
    expect(wrapper.text()).toContain('Create and track your quests powered by AI.')
  })

  it('renders navigation buttons with correct labels and routes', async () => {
    const wrapper = await mountSuspended(HomeHeroCard)
    const buttons = wrapper.findAllComponents({ name: 'VBtn' })

    // ✅ Button count
    expect(buttons).toHaveLength(2)

    // ✅ Text and target routes
    const viewQuests = buttons[0]
    const createQuest = buttons[1]

    expect(viewQuests.text()).toBe('View Quests')
    expect(viewQuests.attributes('to')).toBe('/quests')

    expect(createQuest.text()).toBe('Create Quest')
    expect(createQuest.attributes('to')).toBe('/quests/new')
  })

  it('applies Vuetify layout classes', async () => {
    const wrapper = await mountSuspended(HomeHeroCard)
    const container = wrapper.find('.main-container')

    expect(container.exists()).toBe(true)
    expect(container.classes()).toContain('d-flex')
    expect(container.classes()).toContain('justify-center')
    expect(container.classes()).toContain('align-center')
  })
})
