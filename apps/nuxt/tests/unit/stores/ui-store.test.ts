import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

type ThemeMode = 'light' | 'dark'

const cookieRef = ref<ThemeMode | null>('light')
const mockTheme = { global: { name: { value: 'light' as ThemeMode } } }

vi.mock('nuxt/app', () => ({
  useCookie: () => cookieRef,
}))

vi.mock('vuetify', () => ({
  useTheme: () => mockTheme,
}))

let useUiStore: typeof import('~/stores/ui')['useUiStore']

beforeEach(async () => {
  setActivePinia(createPinia())
  cookieRef.value = 'light'
  mockTheme.global.name.value = 'light'
  ;({ useUiStore } = await import('~/stores/ui'))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useUiStore', () => {
  it('initialises with cookie preference', () => {
    cookieRef.value = 'dark'
    const store = useUiStore()

    expect(store.themeMode).toBe('dark')
    expect(mockTheme.global.name.value).toBe('dark')
  })

  it('sets theme mode and updates cookie', () => {
    const store = useUiStore()

    store.setTheme('dark')

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
