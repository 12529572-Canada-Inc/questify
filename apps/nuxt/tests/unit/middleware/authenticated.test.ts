import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import authenticatedMiddleware from '~/middleware/authenticated.global'

describe('authenticated middleware', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('allows quest creation route without forcing a redirect', async () => {
    const fetch = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn()

    vi.stubGlobal('useUserSession', () => ({
      loggedIn: ref(false),
      fetch,
    }))
    vi.stubGlobal('navigateTo', navigateTo)

    await authenticatedMiddleware({ path: '/quests/new' } as any)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('redirects unauthenticated users accessing protected quest routes', async () => {
    const fetch = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn()

    vi.stubGlobal('useUserSession', () => ({
      loggedIn: ref(false),
      fetch,
    }))
    vi.stubGlobal('navigateTo', navigateTo)

    await authenticatedMiddleware({ path: '/quests/alpha' } as any)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith('/auth/login')
  })

  it('allows authenticated users to continue without redirect', async () => {
    const fetch = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn()

    vi.stubGlobal('useUserSession', () => ({
      loggedIn: ref(true),
      fetch,
    }))
    vi.stubGlobal('navigateTo', navigateTo)

    await authenticatedMiddleware({ path: '/quests/beta' } as any)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
