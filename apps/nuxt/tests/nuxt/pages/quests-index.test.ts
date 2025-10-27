import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, Suspense } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuestsIndexPage from '~/pages/quests/index.vue'
import { useQuestStore } from '~/stores/quest'
import { useUserStore } from '~/stores/user'
import { createQuest } from '../../unit/support/sample-data'

const buttonStub = {
  props: ['to'],
  template: '<button :data-to="to"><slot /></button>',
}

const switchStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<label><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" /></label>',
}

describe('quests index page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders quests returned from the data provider', async () => {
    const questStore = useQuestStore()
    const userStore = useUserStore()
    userStore.setUser({ id: 'user-1', name: 'Owner', email: 'owner@example.com' } as never)
    const quests = [createQuest({ id: 'quest-1', title: 'Document testing strategy' })]
    vi.spyOn(questStore, 'fetchQuests').mockImplementation(async () => {
      questStore.setQuests(quests as never)
      return quests as never
    })

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
          VSwitch: switchStub,
          QuestList: {
            props: ['quests', 'currentUserId'],
            template: '<ul><li v-for="quest in quests" :key="quest.id">{{ quest.title }}</li></ul>',
          },
          QuestDeleteDialog: { template: '<div class="quest-delete-dialog" />' },
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

  it('toggles archived quests via the switch control', async () => {
    const questStore = useQuestStore()
    const userStore = useUserStore()
    userStore.setUser({ id: 'user-1', name: 'Owner', email: 'owner@example.com' } as never)
    const fetchSpy = vi.spyOn(questStore, 'fetchQuests').mockResolvedValue([] as never)

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
          VSwitch: switchStub,
          QuestList: { props: ['quests', 'currentUserId'], template: '<div class="quest-list" />' },
          QuestDeleteDialog: { template: '<div />' },
        },
      },
    })

    await flushPromises()
    fetchSpy.mockClear()

    const toggle = wrapper.find('input[type="checkbox"]')
    await toggle.setValue(true)
    await toggle.trigger('change')
    await flushPromises()

    expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ includeArchived: true, force: true }))
  })
})
