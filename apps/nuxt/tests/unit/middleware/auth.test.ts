import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import authMiddleware from '~/middleware/auth'

const navigateToMock = vi.fn()
const fetchSessionMock = vi.fn()
const loggedInRef = ref(false)

vi.mock('pinia', () => ({
  storeToRefs: (store: { loggedIn: typeof loggedInRef }) => ({
    loggedIn: store.loggedIn,
  }),
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    loggedIn: loggedInRef,
    fetchSession: fetchSessionMock,
  }),
}))

describe('auth middleware', () => {
  beforeEach(() => {
    loggedInRef.value = false
    fetchSessionMock.mockReset()
    navigateToMock.mockReset()
    vi.stubGlobal('navigateTo', navigateToMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects to login when still unauthenticated after fetch', async () => {
    fetchSessionMock.mockResolvedValue(undefined)

    await authMiddleware()

    expect(fetchSessionMock).toHaveBeenCalled()
    expect(navigateToMock).toHaveBeenCalledWith('/auth/login')
  })

  it('continues when session fetch marks user as logged in', async () => {
    fetchSessionMock.mockImplementationOnce(async () => {
      loggedInRef.value = true
      return undefined
    })

    await authMiddleware()

    expect(fetchSessionMock).toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
