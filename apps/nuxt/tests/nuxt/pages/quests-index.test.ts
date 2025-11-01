import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type Component, h, Suspense } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuestsIndexPage from '~/pages/quests/index.vue'
import { useQuestStore } from '~/stores/quest'
import { useUserStore } from '~/stores/user'
import { createQuest } from '../../unit/support/sample-data'

const navigateToMock = vi.hoisted(() => vi.fn())

vi.mock('#app', async () => {
  const actual = await vi.importActual<any>('#app')
  return {
    ...actual,
    navigateTo: navigateToMock,
  }
})

vi.mock('#app/composables/router', async () => {
  const actual = await vi.importActual<any>('#app/composables/router')
  return {
    ...actual,
    navigateTo: navigateToMock,
  }
})

const buttonStub = {
  props: ['to'],
  template: '<button :data-to="to"><slot /></button>',
}

const switchStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<label><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" /></label>',
}

const questListStub = {
  props: ['quests', 'currentUserId'],
  template: '<ul><li v-for="quest in quests" :key="quest.id">{{ quest.title }}</li></ul>',
}

const questDeleteDialogStub = { template: '<div class="quest-delete-dialog" />' }

function createGlobalOptions(overrides: {
  questList?: Component
  questDeleteDialog?: Component
} = {}) {
  return {
    mocks: {
      $vuetify: {
        display: {
          smAndDown: false,
        },
      },
    },
    stubs: {
      NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
      VContainer: { template: '<div><slot /></div>' },
      VRow: { template: '<div><slot /></div>' },
      VCol: { template: '<div><slot /></div>' },
      VBtn: buttonStub,
      VSwitch: switchStub,
      QuestList: overrides.questList ?? questListStub,
      QuestDeleteDialog: overrides.questDeleteDialog ?? questDeleteDialogStub,
    },
  }
}

describe('quests index page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    navigateToMock.mockReset()
    vi.clearAllMocks()
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
      global: createGlobalOptions(),
    })

    await flushPromises()

    const page = wrapper.findComponent(QuestsIndexPage)
    expect(page.exists()).toBe(true)
    expect(page.text()).toContain('Quests')
    expect(page.text()).toContain('Document testing strategy')

    const createButton = wrapper.findAll('button').find(button => button.text().trim() === 'Create Quest')
    expect(createButton?.attributes('data-to')).toBe('/quests/new')
  })

  it('redirects to the quest creation page when no quests are available', async () => {
    const questStore = useQuestStore()
    const userStore = useUserStore()
    userStore.setUser({ id: 'user-1', name: 'Owner', email: 'owner@example.com' } as never)
    navigateToMock.mockResolvedValue(undefined as never)
    vi.spyOn(questStore, 'fetchQuests').mockImplementation(async () => {
      questStore.setQuests([] as never)
      return [] as never
    })

    mount({
      render() {
        return h(Suspense, {}, { default: () => h(QuestsIndexPage) })
      },
    }, {
      global: createGlobalOptions(),
    })

    await flushPromises()

    expect(navigateToMock).toHaveBeenCalledWith('/quests/new', { replace: true })
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
      global: createGlobalOptions({
        questList: { props: ['quests', 'currentUserId'], template: '<div class="quest-list" />' },
        questDeleteDialog: { template: '<div />' },
      }),
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
