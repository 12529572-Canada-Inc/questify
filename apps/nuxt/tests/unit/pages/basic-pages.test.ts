import '../support/mocks/vueuse'

import { ref, h, Suspense, type ComponentPublicInstance, type Ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomePage from '../../../app/pages/index.vue'
import QuestsIndexPage from '../../../app/pages/quests/index.vue'
import QuestsNewPage from '../../../app/pages/quests/new.vue'
import AuthLoginPage from '../../../app/pages/auth/login.vue'
import AuthSignupPage from '../../../app/pages/auth/signup.vue'
import DashboardPage from '../../../app/pages/dashboard.vue'
import { shallowMountWithBase } from '../support/mount-options'
import { createQuest } from '../support/sample-data'
import { useUserStore } from '~/stores/user'
import { useQuestStore } from '~/stores/quest'

const routerPush = vi.fn()
const fetchSession = vi.fn().mockResolvedValue(undefined)
const fetchApi = vi.fn().mockResolvedValue(undefined)
const useMetricsMock = vi.fn()
let sessionUser: Ref<unknown>
let sessionLoggedIn: Ref<boolean>

vi.mock('~/composables/useMetrics', () => ({
  useMetrics: (...args: unknown[]) => useMetricsMock(...args),
}))

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
  useMetricsMock.mockReset()

  sessionUser = ref<SessionUser | null>(null)
  sessionLoggedIn = ref(false)
  vi.stubGlobal('useUserSession', () => ({
    user: sessionUser,
    loggedIn: sessionLoggedIn,
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
  vi.stubGlobal('navigateTo', routerPush)

  useMetricsMock.mockResolvedValue({
    data: ref({
      totalQuests: 0,
      activeQuests: 0,
      completedQuests: 0,
      publicQuests: 0,
      privateQuests: 0,
      totalTasks: 0,
      completedTasks: 0,
      completionRate: 0,
      lastActiveAt: null,
    }),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  })
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

  it('redirects the root page to the dashboard when logged in', async () => {
    sessionUser.value = { id: 'user-1', email: 'hero@example.com' } as SessionUser
    sessionLoggedIn.value = true
    const userStore = useUserStore()
    userStore.setUser(sessionUser.value)

    shallowMountWithBase(HomePage, {
      global: {
        stubs: {
          HomeHeroCard: { template: '<div class="hero-stub">Hero</div>' },
        },
        mocks: {
          $fetch: fetchApi,
        },
      },
    })

    await flushPromises()
    expect(routerPush).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('renders the dashboard page with metrics', async () => {
    useMetricsMock.mockResolvedValueOnce({
      data: ref({
        totalQuests: 5,
        activeQuests: 3,
        completedQuests: 2,
        publicQuests: 1,
        privateQuests: 4,
        totalTasks: 12,
        completedTasks: 9,
        completionRate: 0.75,
        lastActiveAt: new Date('2024-01-01T12:00:00Z').toISOString(),
      }),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn(),
    })

    const wrapper = shallowMountWithBase({
      render() {
        return h(Suspense, {}, { default: () => h(DashboardPage) })
      },
    }, {
      global: {
        stubs: {
          VContainer: { template: '<div><slot /></div>' },
          VAlert: { template: '<div><slot /></div>' },
          VCard: { template: '<div><slot /></div>' },
          VCardText: { template: '<div><slot /></div>' },
          VCardTitle: { template: '<div><slot /></div>' },
          VDivider: { template: '<div><slot /></div>' },
          VRow: { template: '<div><slot /></div>' },
          VCol: { template: '<div><slot /></div>' },
          VBtn: { props: ['to'], template: '<button :data-to=\"to\"><slot /></button>' },
          VIcon: { props: ['icon'], template: '<i :data-icon=\"icon\"></i>' },
          VAvatar: { template: '<div><slot /></div>' },
          VSkeletonLoader: { template: '<div class=\"skeleton\"></div>' },
          VProgressCircular: { props: ['modelValue'], template: '<div class=\"progress\"><slot /></div>' },
        },
      },
    })

    await flushPromises()
    expect(wrapper.text()).toContain('Private Quests')
    expect(wrapper.text()).toContain('Public Quests')
    expect(wrapper.text()).toContain('Quest Overview')
    expect(wrapper.text()).toContain('Completion Rate')
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

  it('submits the login form and navigates to the dashboard', async () => {
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
    expect(routerPush).toHaveBeenCalledWith('/dashboard')
  })

  it('submits the signup form and navigates to the dashboard', async () => {
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
    expect(routerPush).toHaveBeenCalledWith('/dashboard')
  })
})
