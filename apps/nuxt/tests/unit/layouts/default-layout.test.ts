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

const routerPush = vi.fn()
const fetchSession = vi.fn().mockResolvedValue(undefined)
const fetchApi = vi.fn().mockResolvedValue(undefined)
const clearSession = vi.fn()
const mockTheme = { global: { name: { value: 'light' as 'light' | 'dark' } } }
const displayWidth = ref(1200)

vi.mock('vuetify', () => ({
  useTheme: () => mockTheme,
  useDisplay: () => ({
    width: displayWidth,
  }),
}))

beforeEach(() => {
  setActivePinia(createPinia())

  routerPush.mockReset()
  clearSession.mockReset()
  fetchSession.mockReset()
  fetchApi.mockReset()
  displayWidth.value = 1200

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
    const logoutButton = wrapper.find('.app-bar-auth__btn')
    await logoutButton.trigger('click')
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
    displayWidth.value = 480

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

    expect(wrapper.find('.app-bar-actions').exists()).toBe(false)
    const menuBtn = wrapper.find('[data-testid="app-bar-menu-button"]')
    expect(menuBtn.exists()).toBe(true)

    await menuBtn.trigger('click')
    await flushPromises()

    const shareItem = wrapper.get('[data-testid="app-bar-menu-item-share"]')
    await shareItem.trigger('click')
    await flushPromises()

    const layoutComponent = wrapper.findComponent(DefaultLayout)
    expect(layoutComponent.vm.shareDialogOpen).toBe(true)
    expect(layoutComponent.vm.mobileMenuOpen).toBe(false)
  })
})
