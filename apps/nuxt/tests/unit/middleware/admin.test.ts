import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import adminMiddleware from '~/middleware/admin'

const navigateToMock = vi.fn()
const fetchSessionMock = vi.fn()
const isAdmin = ref(true)
const userRef = ref<{ id: string } | null>({ id: 'user-1' })

vi.mock('pinia', () => ({
  storeToRefs: (store: any) => ({
    user: store.user,
  }),
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    user: userRef,
    fetchSession: fetchSessionMock,
  }),
}))

vi.mock('~/composables/useAccessControl', () => ({
  useAccessControl: () => ({
    isAdmin,
  }),
}))

describe('admin middleware', () => {
  beforeEach(() => {
    userRef.value = { id: 'user-1' }
    isAdmin.value = true
    fetchSessionMock.mockReset()
    navigateToMock.mockReset()
    vi.stubGlobal('navigateTo', navigateToMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('allows admin user through without redirect', async () => {
    await adminMiddleware()

    expect(fetchSessionMock).not.toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('fetches session when user is missing, then allows admin', async () => {
    userRef.value = null
    fetchSessionMock.mockImplementationOnce(async () => {
      userRef.value = { id: 'user-2' }
      return undefined
    })

    await adminMiddleware()

    expect(fetchSessionMock).toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('redirects non-admin users to quests', async () => {
    isAdmin.value = false

    await adminMiddleware()

    expect(navigateToMock).toHaveBeenCalledWith('/quests')
  })
})
