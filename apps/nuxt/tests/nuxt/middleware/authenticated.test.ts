import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import authenticatedMiddleware from '~/middleware/authenticated.global'

describe('authenticated middleware', () => {
  type MiddlewareArgs = Parameters<typeof authenticatedMiddleware>

  const createTo = (path: string) => ({ path } as MiddlewareArgs[0])
  const createFrom = () => ({} as MiddlewareArgs[1])

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

    await authenticatedMiddleware(createTo('/quests/new'), createFrom())

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

    await authenticatedMiddleware(createTo('/quests/alpha'), createFrom())

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

    await authenticatedMiddleware(createTo('/quests/beta'), createFrom())

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
