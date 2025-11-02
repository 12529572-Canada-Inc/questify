import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import DefaultLayout from '../../../app/layouts/default.vue'
import { mountWithBase } from '../support/mount-options'
import { useUserStore } from '~/stores/user'
import { useQuestStore } from '~/stores/quest'
import { useUiStore } from '~/stores/ui'
import { createQuest } from '../support/sample-data'

const originalUseRuntimeConfig = (globalThis as typeof globalThis & { useRuntimeConfig?: () => unknown }).useRuntimeConfig

const routerPush = vi.fn()
const fetchSession = vi.fn().mockResolvedValue(undefined)
const fetchApi = vi.fn().mockResolvedValue(undefined)
const clearSession = vi.fn()
const mockTheme = { global: { name: { value: 'light' as 'light' | 'dark' } } }
const isMobileRef = ref(false)

vi.mock('vuetify', () => ({
  useTheme: () => mockTheme,
}))

vi.mock('@vueuse/core', () => ({
  useMediaQuery: () => isMobileRef,
}))

beforeEach(() => {
  Reflect.set(globalThis, 'useRuntimeConfig', vi.fn(() => ({
    public: { features: { aiAssist: true } },
  })))
  setActivePinia(createPinia())

  routerPush.mockReset()
  clearSession.mockReset()
  fetchSession.mockReset()
  fetchApi.mockReset()
  isMobileRef.value = false

  const sessionUser = ref({ id: 'user-1' })
  vi.stubGlobal('useUserSession', () => ({
    user: sessionUser,
    loggedIn: ref(true),
    clear: clearSession,
    fetch: fetchSession,
    openInPopup: vi.fn(),
  }))

  const userStore = useUserStore()
  userStore.setUser(sessionUser.value)

  const questStore = useQuestStore()
  questStore.setQuests([createQuest()])

  const uiStore = useUiStore()
  uiStore.setTheme('light')

  vi.stubGlobal('useRouter', () => ({
    push: routerPush,
  }))
  vi.stubGlobal('useRequestURL', () => ({
    origin: 'https://example.com',
  }))
  // Stub both $fetch global and the useSnackbar composable
  vi.stubGlobal('$fetch', fetchApi)
  vi.stubGlobal('useSnackbar', () => ({
    showSnackbar: vi.fn(),
  }))
  vi.stubGlobal('useAccessControl', () => ({
    isAdmin: ref(false),
  }))
})

afterEach(() => {
  if (originalUseRuntimeConfig) {
    Reflect.set(globalThis, 'useRuntimeConfig', originalUseRuntimeConfig)
  }
  else {
    Reflect.deleteProperty(globalThis, 'useRuntimeConfig')
  }
  vi.unstubAllGlobals()
})

describe('default layout', () => {
  it('logs out and clears the session', async () => {
    const SuspenseWrapper = {
      components: { DefaultLayout },
      template: '<Suspense><DefaultLayout><div class="slot-marker">Content</div></DefaultLayout></Suspense>',
    }

    const wrapper = mountWithBase(SuspenseWrapper, {
      global: {
        stubs: {
          ShareDialog: { template: '<div class="share-dialog-stub"></div>' },
          VImg: { template: '<img />' },
        },
      },
    })

    // Wait for async setup to complete
    await flushPromises()

    // Find and click the logout button
    const logoutButton = wrapper.findAll('.app-bar-auth__btn').find(btn => btn.text().includes('Logout'))
    expect(logoutButton).toBeDefined()
    await logoutButton!.trigger('click')
    await flushPromises()

    expect(fetchApi).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    expect(clearSession).toHaveBeenCalled()
    expect(routerPush).toHaveBeenCalledWith('/auth/login')
  })

  it('renders login/signup links when logged out', async () => {
    // Set up logged out state BEFORE creating stores
    const sessionUser = ref(null)
    const loggedInRef = ref(false)
    vi.stubGlobal('useUserSession', () => ({
      user: sessionUser,
      loggedIn: loggedInRef,
      clear: clearSession,
      fetch: fetchSession,
      openInPopup: vi.fn(),
    }))

    // Recreate pinia to pick up the new stub
    setActivePinia(createPinia())

    const userStore = useUserStore()
    userStore.setUser(null)
    useQuestStore().reset()

    const SuspenseWrapper = {
      components: { DefaultLayout },
      template: '<Suspense><DefaultLayout /></Suspense>',
    }

    const wrapper = mountWithBase(SuspenseWrapper, {
      global: {
        stubs: {
          ShareDialog: { template: '<div class="share-dialog-stub"></div>' },
          VImg: { template: '<img />' },
        },
      },
    })

    // Wait for async setup to complete
    await flushPromises()

    expect(wrapper.text()).toContain('Login')
    expect(wrapper.text()).toContain('Signup')
  })

  it('shows mobile menu under breakpoint and opens share dialog from menu', async () => {
    isMobileRef.value = true

    const SuspenseWrapper = {
      components: { DefaultLayout },
      template: '<Suspense><DefaultLayout /></Suspense>',
    }

    const wrapper = mountWithBase(SuspenseWrapper, {
      global: {
        stubs: {
          ShareDialog: { template: '<div class="share-dialog-stub"></div>' },
          VImg: { template: '<img />' },
        },
      },
    })

    await flushPromises()

    const desktopActions = wrapper.get('.app-bar-actions')
    expect(desktopActions.classes()).toContain('app-bar-actions--hidden')

    const mobileActions = wrapper.get('.app-bar-mobile-actions')
    expect(mobileActions.classes()).toContain('app-bar-mobile-actions--visible')
    const menuBtn = wrapper.find('[data-testid="app-bar-menu-button"]')
    expect(menuBtn.exists()).toBe(true)

    await menuBtn.trigger('click')
    await flushPromises()

    const shareItem = wrapper.get('[data-testid="app-bar-menu-item-share"]')
    await shareItem.trigger('click')
    await flushPromises()

    const layoutComponent = wrapper.findComponent(DefaultLayout)
    const layoutVm = layoutComponent.vm as unknown as {
      shareDialogOpen: boolean
      mobileMenuOpen: boolean
    }
    expect(layoutVm.shareDialogOpen).toBe(true)
    expect(layoutVm.mobileMenuOpen).toBe(false)
  })
})
