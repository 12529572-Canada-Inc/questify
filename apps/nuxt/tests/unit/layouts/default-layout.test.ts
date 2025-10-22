import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type ComponentPublicInstance } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import DefaultLayout from '../../../app/layouts/default.vue'
import { mountWithBase } from '../support/mount-options'
import { useUserStore } from '~/stores/user'
import { useQuestStore } from '~/stores/quest'
import { useUiStore } from '~/stores/ui'
import { createQuest } from '../support/sample-data'

const routerPush = vi.fn()
const fetchSession = vi.fn().mockResolvedValue(undefined)
const fetchApi = vi.fn().mockResolvedValue(undefined)
const clearSession = vi.fn()
const mockTheme = { global: { name: { value: 'light' as 'light' | 'dark' } } }

vi.mock('nuxt/app', () => ({
  useCookie: () => ref<'light' | 'dark'>('light'),
}))

vi.mock('vuetify', () => ({
  useTheme: () => mockTheme,
}))

beforeEach(() => {
  setActivePinia(createPinia())

  routerPush.mockReset()
  clearSession.mockReset()
  fetchSession.mockReset()
  fetchApi.mockReset()

  const sessionUser = ref({ id: 'user-1' })
  vi.stubGlobal('useUserSession', () => ({
    user: sessionUser,
    loggedIn: ref(true),
    clear: clearSession,
    fetch: fetchSession,
  }))

  const userStore = useUserStore()
  userStore.setUser(sessionUser.value)

  const questStore = useQuestStore()
  questStore.setQuests([createQuest()])

  useUiStore().setTheme('light')

  vi.stubGlobal('useRouter', () => ({
    push: routerPush,
  }))
  vi.stubGlobal('useRequestURL', () => ({
    origin: 'https://example.com',
  }))
  vi.stubGlobal('$fetch', fetchApi)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('default layout', () => {
  it('logs out and clears the session', async () => {
    const wrapper = mountWithBase(DefaultLayout, {
      slots: {
        default: '<div class="slot-marker">Content</div>',
      },
      global: {
        stubs: {
          ShareDialog: { template: '<div class="share-dialog-stub"></div>' },
        },
        mocks: {
          $fetch: fetchApi,
        },
      },
    })

    const vm = wrapper.vm as ComponentPublicInstance & { logout?: () => Promise<void> }
    await vm.logout?.()

    expect(fetchApi).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    expect(clearSession).toHaveBeenCalled()
    expect(routerPush).toHaveBeenCalledWith('/auth/login')
  })

  it('renders login/signup links when logged out', () => {
    const sessionUser = ref(null)
    vi.stubGlobal('useUserSession', () => ({
      user: sessionUser,
      loggedIn: ref(false),
      clear: clearSession,
      fetch: fetchSession,
    }))

    const userStore = useUserStore()
    userStore.setUser(null)
    useQuestStore().setQuests([])

    const wrapper = mountWithBase(DefaultLayout, {
      global: {
        stubs: {
          ShareDialog: { template: '<div class="share-dialog-stub"></div>' },
        },
        mocks: {
          $fetch: fetchApi,
        },
      },
    })

    expect(wrapper.text()).toContain('Login')
    expect(wrapper.text()).toContain('Signup')
  })
})
