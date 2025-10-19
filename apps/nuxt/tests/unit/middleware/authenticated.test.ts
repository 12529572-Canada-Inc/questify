import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import middleware from '../../../app/middleware/authenticated.global'

const fetchMock = vi.fn()
const navigateToMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  navigateToMock.mockReset()

  vi.stubGlobal('useUserSession', () => ({
    loggedIn: { value: false },
    fetch: fetchMock,
  }))

  vi.stubGlobal('navigateTo', navigateToMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  globalThis.defineNuxtRouteMiddleware = globalThis.defineNuxtRouteMiddleware ?? (fn => fn)
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
    vi.stubGlobal('useUserSession', () => ({
      loggedIn: { value: true },
      fetch: fetchMock,
    }))

    await middleware({ path: '/quests/abc' } as never)
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
