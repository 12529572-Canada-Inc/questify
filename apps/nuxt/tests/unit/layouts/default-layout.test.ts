import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type ComponentPublicInstance } from 'vue'
import DefaultLayout from '../../../app/layouts/default.vue'
import { mountWithBase } from '../support/mount-options'

const routerPush = vi.fn()
const clearSession = vi.fn()
const fetchSession = vi.fn().mockResolvedValue(undefined)
const fetchApi = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  routerPush.mockReset()
  clearSession.mockReset()
  fetchSession.mockReset()
  fetchApi.mockReset()

  vi.stubGlobal('useUserSession', () => ({
    loggedIn: ref(true),
    clear: clearSession,
    fetch: fetchSession,
  }))
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
    vi.stubGlobal('useUserSession', () => ({
      loggedIn: ref(false),
      clear: clearSession,
      fetch: fetchSession,
    }))

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
