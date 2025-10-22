import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUiStore } from '~/stores/ui'

type ThemeMode = 'light' | 'dark'

const mockTheme = { global: { name: { value: 'light' as ThemeMode } } }

vi.mock('vuetify', () => ({
  useTheme: () => mockTheme,
}))

beforeEach(() => {
  // Clear the cookie store to ensure each test starts fresh
  const cookieRef = useCookie<ThemeMode | null>('questify-theme')
  cookieRef.value = 'light'
  mockTheme.global.name.value = 'light'
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useUiStore', () => {
  it('initialises with cookie preference', () => {
    const cookieRef = useCookie<ThemeMode | null>('questify-theme')
    cookieRef.value = 'dark'
    const store = useUiStore()

    expect(store.themeMode).toBe('dark')
    expect(mockTheme.global.name.value).toBe('dark')
  })

  it('sets theme mode and updates cookie', async () => {
    const cookieRef = useCookie<ThemeMode | null>('questify-theme')
    const store = useUiStore()

    store.setTheme('dark')
    await nextTick()

    expect(store.isDarkMode).toBe(true)
    expect(cookieRef.value).toBe('dark')
    expect(mockTheme.global.name.value).toBe('dark')
  })

  it('toggles between light and dark themes', () => {
    const store = useUiStore()

    store.toggleTheme()
    expect(store.themeMode).toBe('dark')

    store.toggleTheme()
    expect(store.themeMode).toBe('light')
  })
})
