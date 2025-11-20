import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, type Component, h, Suspense } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
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

const textFieldStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input type="text" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}

const selectStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input class="select-stub" type="text" :value="Array.isArray(modelValue) ? modelValue.join(\',\') : modelValue" @input="$emit(\'update:modelValue\', $event.target.value ? $event.target.value.split(\',\') : [])" />',
}

const dataTableStub = {
  props: ['items'],
  template: `
    <div class="quest-table-stub">
      <div
        v-for="item in items"
        :key="item.id"
        class="quest-row"
      >
        <div class="quest-cell">
          <slot name="item.title" :item="item">
            <span>{{ item.title }}</span>
          </slot>
        </div>
        <div class="quest-cell">
          <slot name="item.status" :item="item" />
        </div>
        <div class="quest-cell">
          <slot name="item.isPublic" :item="item" />
        </div>
        <div class="quest-cell">
          <slot name="item.updatedAt" :item="item" />
        </div>
        <div class="quest-cell">
          <slot name="item.actions" :item="item" />
        </div>
      </div>
      <div
        v-if="!items?.length"
        class="quest-empty"
      >
        <slot name="no-data">No quests</slot>
      </div>
    </div>
  `,
}

const questDeleteDialogStub = { template: '<div class="quest-delete-dialog" />' }

function createGlobalOptions(overrides: {
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
      VTextField: textFieldStub,
      VSelect: selectStub,
      VCard: { template: '<div class="v-card"><slot /></div>' },
      VCardText: { template: '<div><slot /></div>' },
      VChip: { template: '<span class="chip"><slot /></span>' },
      VDataTable: dataTableStub,
      VIcon: { template: '<i><slot /></i>' },
      VDivider: { template: '<hr />' },
      QuestDeleteDialog: overrides.questDeleteDialog ?? questDeleteDialogStub,
    },
  }
}

describe('quests index page', () => {
  const routerReplace = vi.fn().mockResolvedValue(undefined)
  const route = reactive({
    query: {},
    path: '/quests',
  })
  let QuestsIndexPage: typeof import('~/pages/quests/index.vue')['default']

  beforeEach(async () => {
    setActivePinia(createPinia())
    routerReplace.mockClear()
    route.query = {}
    vi.stubGlobal('useRoute', () => route)
    vi.stubGlobal('useRouter', () => ({
      replace: routerReplace,
    }))
    QuestsIndexPage = (await import('~/pages/quests/index.vue')).default
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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

  it('toggles archived quests via the switch control', async () => {
    const questStore = useQuestStore()
    const userStore = useUserStore()
    userStore.setUser({ id: 'user-1', name: 'Owner', email: 'owner@example.com' } as never)
    const existingQuest = createQuest({ id: 'quest-99', title: 'Existing quest' })
    questStore.setQuests([existingQuest] as never)
    const fetchSpy = vi.spyOn(questStore, 'fetchQuests').mockResolvedValue([existingQuest] as never)

    const wrapper = mount({
      render() {
        return h(Suspense, {}, { default: () => h(QuestsIndexPage) })
      },
    }, {
      global: createGlobalOptions({
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
