import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeHeroCard from '~/components/home/HomeHeroCard.vue'

function mountHomeHeroCard() {
  return mount(HomeHeroCard, {
    global: {
      stubs: {
        VCard: { template: '<section><slot /></section>' },
        VCardTitle: { template: '<h2><slot /></h2>' },
        VCardText: { template: '<div><slot /></div>' },
        VCardActions: { template: '<div><slot /></div>' },
        VBtn: {
          props: ['to'],
          template: '<button :data-to="to"><slot /></button>',
        },
      },
    },
  })
}

describe('HomeHeroCard', () => {
  it('renders the hero title and supporting copy', () => {
    const wrapper = mountHomeHeroCard()

    expect(wrapper.text()).toContain('Welcome to Questify')
    expect(wrapper.text()).toContain('Create and track your quests powered by AI.')
  })

  it('renders navigation buttons with the expected labels and destinations', () => {
    const wrapper = mountHomeHeroCard()
    const buttons = wrapper.findAll('button')

    expect(buttons).toHaveLength(2)

    const [viewQuests, createQuest] = buttons

    expect(viewQuests?.text()).toBe('View Quests')
    expect(viewQuests?.attributes('data-to')).toBe('/quests')

    expect(createQuest?.text()).toBe('Create Quest')
    expect(createQuest?.attributes('data-to')).toBe('/quests/new')
  })
})
