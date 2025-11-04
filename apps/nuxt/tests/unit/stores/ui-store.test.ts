import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUiStore } from '~/stores/ui'
import type { ThemePreference } from 'shared'

type ThemeMode = 'light' | 'dark'

const mockTheme = { global: { name: { value: 'light' as ThemeMode } } }
const useThemeMock = vi.fn(() => mockTheme)
const originalUseRuntimeConfig = (globalThis as typeof globalThis & { useRuntimeConfig?: () => unknown }).useRuntimeConfig

vi.mock('vuetify', () => ({
  useTheme: () => useThemeMock(),
}))

beforeEach(() => {
  vi.useFakeTimers()
  const morning = new Date()
  morning.setHours(10, 0, 0, 0)
  vi.setSystemTime(morning)

  Reflect.set(globalThis, 'useRuntimeConfig', vi.fn(() => ({
    public: { features: { aiAssist: true } },
  })))

  const themeCookie = useCookie<ThemePreference | null>('questify-theme')
  themeCookie.value = 'light'
  const aiCookie = useCookie<'on' | 'off'>('questify-ai-assist')
  aiCookie.value = 'on'

  mockTheme.global.name.value = 'light'
  useThemeMock.mockReset()
  useThemeMock.mockImplementation(() => mockTheme)
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.useRealTimers()
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
    const themeCookie = useCookie<ThemePreference | null>('questify-theme')
    themeCookie.value = 'dark'
    const store = useUiStore()

    expect(store.themePreference).toBe('dark')
    expect(store.themeMode).toBe('dark')
    expect(mockTheme.global.name.value).toBe('dark')
  })

  it('applies auto theme preference based on time of day', () => {
    const themeCookie = useCookie<ThemePreference | null>('questify-theme')
    themeCookie.value = 'auto'

    const night = new Date()
    night.setHours(22, 0, 0, 0)
    vi.setSystemTime(night)

    const store = useUiStore()
    expect(store.themePreference).toBe('auto')
    expect(store.themeMode).toBe('dark')
    expect(mockTheme.global.name.value).toBe('dark')
  })

  it('updates theme preference and cookie', async () => {
    const themeCookie = useCookie<ThemePreference | null>('questify-theme')
    const store = useUiStore()

    store.setThemePreference('dark')
    await nextTick()

    expect(store.themePreference).toBe('dark')
    expect(themeCookie.value).toBe('dark')
    expect(mockTheme.global.name.value).toBe('dark')
  })

  it('cycles auto theme when time changes', async () => {
    const store = useUiStore()

    store.setThemePreference('auto')
    await nextTick()
    expect(store.themeMode).toBe('light')

    const evening = new Date()
    evening.setHours(21, 0, 0, 0)
    vi.setSystemTime(evening)
    vi.advanceTimersByTime(5 * 60 * 1000)
    await nextTick()

    expect(store.themeMode).toBe('dark')
    const morning = new Date()
    morning.setHours(9, 0, 0, 0)
    vi.setSystemTime(morning)
    vi.advanceTimersByTime(5 * 60 * 1000)
    await nextTick()

    expect(store.themeMode).toBe('light')
  })

  it('toggleTheme exits auto mode and flips preference', () => {
    const store = useUiStore()
    store.setThemePreference('auto')

    store.toggleTheme()
    expect(store.themePreference).toBe('dark')

    store.toggleTheme()
    expect(store.themePreference).toBe('light')
  })

  it('re-applies theme once Vuetify context becomes available', async () => {
    useThemeMock.mockImplementationOnce(() => {
      throw new Error('missing context')
    })
    const store = useUiStore()

    store.setThemePreference('dark')
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
