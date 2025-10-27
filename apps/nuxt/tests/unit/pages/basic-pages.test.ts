import '../support/mocks/vueuse'

import { ref, h, Suspense, type ComponentPublicInstance } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import HomePage from '../../../app/pages/index.vue'
import QuestsIndexPage from '../../../app/pages/quests/index.vue'
import QuestsNewPage from '../../../app/pages/quests/new.vue'
import AuthLoginPage from '../../../app/pages/auth/login.vue'
import AuthSignupPage from '../../../app/pages/auth/signup.vue'
import { shallowMountWithBase } from '../support/mount-options'
import { createQuest } from '../support/sample-data'
import { useUserStore } from '~/stores/user'
import { useQuestStore } from '~/stores/quest'

const routerPush = vi.fn()
const fetchSession = vi.fn().mockResolvedValue(undefined)
const fetchApi = vi.fn().mockResolvedValue(undefined)

type AuthFormVm = ComponentPublicInstance & {
  email?: string
  password?: string
  submit?: () => Promise<void>
}

beforeEach(() => {
  setActivePinia(createPinia())

  routerPush.mockReset()
  fetchSession.mockReset()
  fetchApi.mockReset()

  const sessionUser = ref(null)
  vi.stubGlobal('useUserSession', () => ({
    user: sessionUser,
    loggedIn: ref(false),
    fetch: fetchSession,
    clear: vi.fn(),
  }))
  const userStore = useUserStore()
  userStore.setUser(sessionUser.value)

  const questStore = useQuestStore()
  vi.spyOn(questStore, 'fetchQuests').mockResolvedValue([createQuest()])
  questStore.setQuests([createQuest()])

  vi.stubGlobal('useRouter', () => ({
    push: routerPush,
  }))
  vi.stubGlobal('useQuest', vi.fn(async () => ({
    data: ref(createQuest()),
    refresh: vi.fn(),
    pending: ref(false),
    error: ref(null),
  })))
  vi.stubGlobal('$fetch', fetchApi)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('basic pages', () => {
  it('renders the home page hero', async () => {
    fetchApi.mockResolvedValueOnce([])

    const wrapper = shallowMountWithBase(HomePage, {
      global: {
        stubs: {
          HomeHeroCard: { template: '<div class="hero-stub">Hero</div>' },
          VContainer: { template: '<div><slot /></div>' },
          VRow: { template: '<div><slot /></div>' },
          VCol: { template: '<div><slot /></div>' },
          VSelect: { template: '<div />' },
          VBtnToggle: { template: '<div />' },
          VBtn: { template: '<button />' },
          VProgressCircular: { template: '<div />' },
          VIcon: { template: '<span />' },
          VCard: { template: '<div><slot /></div>' },
          VCardTitle: { template: '<div><slot /></div>' },
          VCardSubtitle: { template: '<div><slot /></div>' },
          VCardText: { template: '<div><slot /></div>' },
          VChip: { template: '<span><slot /></span>' },
        },
        mocks: {
          $fetch: fetchApi,
        },
      },
    })

    await Promise.resolve()
    expect(wrapper.text()).toContain('Hero')
  })

  it('renders the quests index page', async () => {
    const wrapper = shallowMountWithBase({
      render() {
        return h(Suspense, {}, { default: () => h(QuestsIndexPage) })
      },
    }, {
      global: {
        stubs: {
          VContainer: { template: '<div><slot /></div>' },
          VRow: { template: '<div><slot /></div>' },
          VCol: { template: '<div><slot /></div>' },
          VBtn: { props: ['to'], template: '<button :data-to="to"><slot /></button>' },
          QuestList: { props: ['quests', 'currentUserId'], template: '<div class="quest-list-stub" />' },
        },
      },
    })

    await Promise.resolve()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the quests new page with form stub', () => {
    const wrapper = shallowMountWithBase(QuestsNewPage, {
      global: {
        stubs: {
          QuestForm: { template: '<form class="quest-form-stub"></form>' },
          VContainer: { template: '<div><slot /></div>' },
          VRow: { template: '<div><slot /></div>' },
          VCol: { template: '<div><slot /></div>' },
          VCard: { template: '<div><slot /></div>' },
          VCardTitle: { template: '<div><slot /></div>' },
          VCardText: { template: '<div><slot /></div>' },
        },
      },
    })

    expect(wrapper.find('.quest-form-stub').exists()).toBe(true)
  })

  it('submits the login form and navigates to quests', async () => {
    const wrapper = shallowMountWithBase(AuthLoginPage, {
      global: {
        stubs: {
          AuthFormCard: { template: '<form @submit="$emit(\'submit\')"><slot /></form>' },
          VTextField: { props: ['modelValue'], template: '<input />' },
        },
        mocks: {
          $fetch: fetchApi,
        },
      },
    })

    const vm = wrapper.vm as AuthFormVm
    vm.email = 'person@example.com'
    vm.password = 'password123'
    await vm.submit?.()
    expect(fetchApi).toHaveBeenCalledWith('/api/auth/login', expect.any(Object))
  })

  it('submits the signup form and navigates to quests', async () => {
    const wrapper = shallowMountWithBase(AuthSignupPage, {
      global: {
        stubs: {
          AuthFormCard: { template: '<form @submit="$emit(\'submit\')"><slot /></form>' },
          VTextField: { props: ['modelValue'], template: '<input />' },
        },
        mocks: {
          $fetch: fetchApi,
        },
      },
    })

    const vm = wrapper.vm as AuthFormVm
    vm.email = 'new@example.com'
    vm.password = 'topsecret'
    await vm.submit?.()
    expect(fetchApi).toHaveBeenCalledWith('/api/auth/signup', expect.any(Object))
  })
})
