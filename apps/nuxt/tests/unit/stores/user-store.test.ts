import { ref, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '~/stores/user'

const sessionUser = ref<SessionUser | null>(null)
const loggedIn = ref(false)
const fetchMock = vi.fn(async () => {
  sessionUser.value = {
    id: 'user-1',
    email: 'hero@example.com',
    name: 'Quest Hero',
    roles: ['Admin'],
    privileges: ['user:read'],
    providers: ['google'],
  }
  loggedIn.value = true
})
const clearMock = vi.fn(async () => {
  sessionUser.value = null
  loggedIn.value = false
})

beforeEach(() => {
  setActivePinia(createPinia())
  sessionUser.value = null
  loggedIn.value = false
  fetchMock.mockClear()
  clearMock.mockClear()

  vi.stubGlobal('useUserSession', () => ({
    user: sessionUser,
    loggedIn,
    fetch: fetchMock,
    clear: clearMock,
    openInPopup: vi.fn(),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useUserStore', () => {
  it('fetches and stores session data', async () => {
    const store = useUserStore()

    const result = await store.fetchSession()

    expect(fetchMock).toHaveBeenCalled()
    expect(store.user).not.toBeNull()
    expect(store.user?.id).toBe('user-1')
    expect(store.loggedIn).toBe(true)
    expect(store.roles).toEqual(['Admin'])
    expect(store.providers).toEqual(['google'])
    expect(result?.roles).toEqual(['Admin'])
  })

  it('clears session details', async () => {
    const store = useUserStore()

    await store.fetchSession()
    await store.clearSession()

    expect(clearMock).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.loggedIn).toBe(false)
    expect(store.providers).toEqual([])
  })

  it('reacts to external session updates', async () => {
    const store = useUserStore()

    sessionUser.value = {
      id: 'user-99',
      email: 'updated@example.com',
      name: 'Updated User',
      roles: ['Support'],
      privileges: [],
      providers: ['facebook'],
    }
    loggedIn.value = true

    await nextTick()

    expect(store.user?.id).toBe('user-99')
    expect(store.loggedIn).toBe(true)
    expect(store.roles).toEqual(['Support'])
    expect(store.providers).toEqual(['facebook'])
  })
})
