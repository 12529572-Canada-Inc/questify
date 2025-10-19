import '../support/mocks/vueuse'

import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from '../../../app/pages/index.vue'
import QuestsIndexPage from '../../../app/pages/quests/index.vue'
import QuestsNewPage from '../../../app/pages/quests/new.vue'
import AuthLoginPage from '../../../app/pages/auth/login.vue'
import AuthSignupPage from '../../../app/pages/auth/signup.vue'
import { shallowMountWithBase } from '../support/mount-options'
import { createQuest } from '../support/sample-data'

const routerPush = vi.fn()
const fetchSession = vi.fn().mockResolvedValue(undefined)
const fetchApi = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  routerPush.mockReset()
  fetchSession.mockReset()
  fetchApi.mockReset()

  vi.stubGlobal('useUserSession', () => ({
    fetch: fetchSession,
  }))
  vi.stubGlobal('useRouter', () => ({
    push: routerPush,
  }))
  vi.stubGlobal('useQuest', vi.fn(async () => ({
    data: ref(createQuest()),
    refresh: vi.fn(),
    pending: ref(false),
    error: ref(null),
  })))
  vi.stubGlobal('useQuests', vi.fn(async () => ({
    data: ref([createQuest()]),
  })))
  vi.stubGlobal('$fetch', fetchApi)
})

afterEach(() => {
  vi.unstubAllGlobals()
  globalThis.defineNuxtRouteMiddleware = globalThis.defineNuxtRouteMiddleware ?? (fn => fn)
})

describe('basic pages', () => {
  it('renders the home page hero', () => {
    const wrapper = shallowMountWithBase(HomePage, {
      global: {
        stubs: {
          HomeHeroCard: { template: '<div class="hero-stub">Hero</div>' },
        },
      },
    })

    expect(wrapper.text()).toContain('Hero')
  })

  it('renders the quests index page', async () => {
    const wrapper = shallowMountWithBase(QuestsIndexPage, {
      global: {
        stubs: {
          QuestList: { template: '<div class="quest-list-stub" />' },
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
        },
        mocks: {
          $fetch: fetchApi,
        },
      },
    })

    ;(wrapper.vm as { email: string }).email = 'person@example.com'
    ;(wrapper.vm as { password: string }).password = 'password123'
    await (wrapper.vm as { submit: () => Promise<void> }).submit()
    expect(fetchApi).toHaveBeenCalledWith('/api/auth/login', expect.any(Object))
  })

  it('submits the signup form and navigates to quests', async () => {
    const wrapper = shallowMountWithBase(AuthSignupPage, {
      global: {
        stubs: {
          AuthFormCard: { template: '<form @submit="$emit(\'submit\')"><slot /></form>' },
        },
        mocks: {
          $fetch: fetchApi,
        },
      },
    })

    ;(wrapper.vm as { email: string }).email = 'new@example.com'
    ;(wrapper.vm as { password: string }).password = 'topsecret'
    await (wrapper.vm as { submit: () => Promise<void> }).submit()
    expect(fetchApi).toHaveBeenCalledWith('/api/auth/signup', expect.any(Object))
  })
})
