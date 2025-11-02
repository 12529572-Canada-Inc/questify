import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUiStore } from '~/stores/ui'

type ThemeMode = 'light' | 'dark'

const mockTheme = { global: { name: { value: 'light' as ThemeMode } } }
const useThemeMock = vi.fn(() => mockTheme)
const originalUseRuntimeConfig = (globalThis as typeof globalThis & { useRuntimeConfig?: () => unknown }).useRuntimeConfig

vi.mock('vuetify', () => ({
  useTheme: () => useThemeMock(),
}))

beforeEach(() => {
  Reflect.set(globalThis, 'useRuntimeConfig', vi.fn(() => ({
    public: { features: { aiAssist: true } },
  })))

  const themeCookie = useCookie<ThemeMode | null>('questify-theme')
  themeCookie.value = 'light'
  const aiCookie = useCookie<'on' | 'off'>('questify-ai-assist')
  aiCookie.value = 'on'

  mockTheme.global.name.value = 'light'
  useThemeMock.mockReset()
  useThemeMock.mockImplementation(() => mockTheme)
  setActivePinia(createPinia())
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

describe('useUiStore', () => {
  it('initialises with cookie preference', () => {
    const themeCookie = useCookie<ThemeMode | null>('questify-theme')
    themeCookie.value = 'dark'
    const store = useUiStore()

    expect(store.themeMode).toBe('dark')
    expect(mockTheme.global.name.value).toBe('dark')
  })

  it('sets theme mode and updates cookie', async () => {
    const themeCookie = useCookie<ThemeMode | null>('questify-theme')
    const store = useUiStore()

    store.setTheme('dark')
    await nextTick()

    expect(store.isDarkMode).toBe(true)
    expect(themeCookie.value).toBe('dark')
    expect(mockTheme.global.name.value).toBe('dark')
  })

  it('toggles between light and dark themes', () => {
    const store = useUiStore()

    store.toggleTheme()
    expect(store.themeMode).toBe('dark')

    store.toggleTheme()
    expect(store.themeMode).toBe('light')
  })

  it('re-applies theme once Vuetify context becomes available', async () => {
    useThemeMock.mockImplementationOnce(() => {
      throw new Error('missing context')
    })
    const store = useUiStore()

    store.setTheme('dark')
    await nextTick()

    expect(store.isDarkMode).toBe(true)
    expect(mockTheme.global.name.value).toBe('dark')
  })

  it('toggles AI assistance preference when enabled', async () => {
    const aiCookie = useCookie<'on' | 'off'>('questify-ai-assist')
    const store = useUiStore()

    expect(store.aiAssistEnabled).toBe(true)
    expect(aiCookie.value).toBe('on')

    store.setAiAssistEnabled(false)
    await nextTick()
    expect(store.aiAssistEnabled).toBe(false)
    expect(aiCookie.value).toBe('off')

    store.toggleAiAssist()
    await nextTick()
    expect(store.aiAssistEnabled).toBe(true)
    expect(aiCookie.value).toBe('on')
  })

  it('keeps AI assistance disabled when the feature flag is off', () => {
    Reflect.set(globalThis, 'useRuntimeConfig', vi.fn(() => ({
      public: { features: { aiAssist: false } },
    })))
    const aiCookie = useCookie<'on' | 'off'>('questify-ai-assist')
    const store = useUiStore()

    expect(store.aiAssistEnabled).toBe(false)
    expect(aiCookie.value).toBe('off')

    store.setAiAssistEnabled(true)
    expect(store.aiAssistEnabled).toBe(false)
    expect(aiCookie.value).toBe('off')
  })
})
