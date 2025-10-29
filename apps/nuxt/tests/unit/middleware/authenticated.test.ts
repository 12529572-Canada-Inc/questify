import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import middleware from '../../../app/middleware/authenticated.global'
import { useUserStore } from '~/stores/user'

const fetchMock = vi.fn()
const navigateToMock = vi.fn()
let sessionUser: Ref<SessionUser | null>
let sessionLoggedIn: Ref<boolean>

beforeEach(() => {
  setActivePinia(createPinia())

  fetchMock.mockReset()
  navigateToMock.mockReset()

  sessionUser = ref(null)
  sessionLoggedIn = ref(false)
  fetchMock.mockResolvedValue({ user: sessionUser.value })
  vi.stubGlobal('useUserSession', () => ({
    user: sessionUser,
    loggedIn: sessionLoggedIn,
    fetch: fetchMock,
    clear: vi.fn(),
    openInPopup: vi.fn(),
  }))

  useUserStore().setUser(null)

  vi.stubGlobal('navigateTo', navigateToMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('authenticated middleware', () => {
  it('allows quest creation route without redirect', async () => {
    await middleware({ path: '/quests/new' } as never)
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('redirects anonymous users from quest routes', async () => {
    await middleware({ path: '/quests/123' } as never)
    expect(fetchMock).toHaveBeenCalled()
    expect(navigateToMock).toHaveBeenCalledWith('/auth/login')
  })

  it('allows quest routes for authenticated users', async () => {
    sessionUser.value = { id: 'user-1' } as SessionUser
    sessionLoggedIn.value = true
    fetchMock.mockResolvedValue({ user: sessionUser.value })
    useUserStore().setUser(sessionUser.value)

    await middleware({ path: '/quests/abc' } as never)
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
