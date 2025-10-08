import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { defineAsyncComponent } from 'vue'
import { flushPromises } from '@vue/test-utils'

const refreshSessionMock = vi.fn()
const routerPushMock = vi.fn()
const useUserSessionMock = vi.fn()
const useRouterMock = vi.fn()

const restoreUserSession = mockNuxtImport('useUserSession', () => useUserSessionMock)
const restoreUseRouter = mockNuxtImport('useRouter', () => useRouterMock)

describe('Auth login page', () => {
  beforeEach(() => {
    refreshSessionMock.mockReset()
    routerPushMock.mockReset()
    useUserSessionMock.mockReset()
    useRouterMock.mockReset()

    useUserSessionMock.mockReturnValue({ fetch: refreshSessionMock })
    useRouterMock.mockReturnValue({ push: routerPushMock })

    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('renders the login form with navigation link', async () => {
    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/auth/login.vue')),
    )

    const html = page.html()
    expect(html).toContain('Login')
    expect(html).toContain('Email')
    expect(html).toContain("Don't have an account? Sign up")
  })

  it('submits credentials and redirects to quests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('$fetch', fetchMock)

    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/auth/login.vue')),
    )

    page.vm.email = 'user@example.com'
    page.vm.password = 'super-secret'
    page.vm.valid = true

    await page.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'user@example.com',
        password: 'super-secret',
      },
    })
    expect(refreshSessionMock).toHaveBeenCalled()
    expect(routerPushMock).toHaveBeenCalledWith('/quests')
  })
})

afterAll(() => {
  restoreUserSession()
  restoreUseRouter()
  vi.unstubAllGlobals()
})
