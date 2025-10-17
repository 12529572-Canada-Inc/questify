import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, Suspense, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import QuestsIndexPage from '~/pages/quests/index.vue'

const buttonStub = {
  props: ['to'],
  template: '<button :data-to="to"><slot /></button>',
}

describe('quests index page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders quests returned from the data provider', async () => {
    const quests = ref([
      { id: 'quest-1', title: 'Document testing strategy' },
    ])

    const questModule = await import('~/composables/useQuest')
    type UseQuestsReturn = Awaited<ReturnType<typeof questModule.useQuests>>
    vi.spyOn(questModule, 'useQuests').mockResolvedValue({
      data: quests,
    } as UseQuestsReturn)

    const wrapper = mount({
      render() {
        return h(Suspense, {}, { default: () => h(QuestsIndexPage) })
      },
    }, {
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          VContainer: { template: '<div><slot /></div>' },
          VRow: { template: '<div><slot /></div>' },
          VCol: { template: '<div><slot /></div>' },
          VBtn: buttonStub,
          QuestList: {
            props: ['quests'],
            template: '<ul><li v-for="quest in quests" :key="quest.id">{{ quest.title }}</li></ul>',
          },
        },
      },
    })

    await flushPromises()

    const page = wrapper.findComponent(QuestsIndexPage)
    expect(page.exists()).toBe(true)
    expect(page.text()).toContain('Quests')
    expect(page.text()).toContain('Document testing strategy')

    const createButton = wrapper.findAll('button').find(button => button.text().trim() === 'Create Quest')
    expect(createButton?.attributes('data-to')).toBe('/quests/new')
  })
})
