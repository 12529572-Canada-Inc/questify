import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useProfileStore } from '~/stores/profile'
import { useUserStore } from '~/stores/user'
import { useUiStore } from '~/stores/ui'

const fetchMock = vi.fn()
const cookieMock = { value: null as string | null }
const originalUseRuntimeConfig = (globalThis as typeof globalThis & { useRuntimeConfig?: () => unknown }).useRuntimeConfig

const profileResponse = {
  id: 'user-1',
  email: 'person@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.png',
  themePreference: 'dark' as const,
  roles: ['member'],
  privileges: ['user:read'],
  providers: ['google'],
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchMock.mockReset()
  cookieMock.value = null // Reset cookie to null before each test

  Reflect.set(globalThis, 'useRuntimeConfig', vi.fn(() => ({
    public: { features: { aiAssist: true } },
  })))

  // Mock useCookie to return our controllable cookie mock
  vi.stubGlobal('useCookie', vi.fn(() => cookieMock))

  vi.stubGlobal('$fetch', fetchMock)
})

afterEach(() => {
  if (originalUseRuntimeConfig) {
    Reflect.set(globalThis, 'useRuntimeConfig', originalUseRuntimeConfig)
  }
  else {
    Reflect.deleteProperty(globalThis, 'useRuntimeConfig')
  }
  vi.unstubAllGlobals()
})

describe('useProfileStore', () => {
  it('fetches profile data and syncs user store', async () => {
    fetchMock.mockResolvedValue(profileResponse)

    const uiStore = useUiStore()
    // Manually set theme to light initially, simulating cookie being set
    cookieMock.value = 'light'
    uiStore.setThemePreference('light')

    // Now set cookie to null to allow sync from profile
    cookieMock.value = null

    const profileStore = useProfileStore()
    const userStore = useUserStore()

    const setUserSpy = vi.spyOn(userStore, 'setUser')
    const syncThemeSpy = vi.spyOn(uiStore, 'syncThemePreferenceFromUser')

    await profileStore.fetchProfile()

    expect(fetchMock).toHaveBeenCalledWith('/api/users/me')
    expect(profileStore.profile).toMatchObject(profileResponse)
    expect(profileStore.status).toBe('idle')
    expect(setUserSpy).toHaveBeenCalledWith(expect.objectContaining({
      id: 'user-1',
      email: 'person@example.com',
      themePreference: 'dark',
      providers: ['google'],
    }))
    // syncThemePreferenceFromUser is called with 'dark'; cookie is null so it should sync
    expect(syncThemeSpy).toHaveBeenCalledWith('dark')
    expect(uiStore.themePreference).toBe('dark')
  })

  it('updates profile and returns new data', async () => {
    const profileStore = useProfileStore()
    const userStore = useUserStore()

    profileStore.profile = { ...profileResponse, name: 'Old Name' }
    userStore.setUser({ id: 'user-1', email: 'person@example.com' })

    fetchMock.mockResolvedValue({ success: true, user: profileResponse })

    const result = await profileStore.updateProfile({ name: 'Test User' })

    expect(fetchMock).toHaveBeenCalledWith('/api/users/me', {
      method: 'PUT',
      body: { name: 'Test User' },
    })
    expect(result).toMatchObject(profileResponse)
    expect(profileStore.profile?.name).toBe('Test User')
    expect(userStore.user?.name).toBe('Test User')
  })
})
