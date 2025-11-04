import { computed, ref, watch } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useTheme } from 'vuetify'
import type { ThemePreference } from 'shared'
import { isThemePreference } from 'shared'

type ThemeMode = 'light' | 'dark'

const THEME_COOKIE_KEY = 'questify-theme'
const AI_ASSIST_COOKIE_KEY = 'questify-ai-assist'
const AUTO_THEME_INTERVAL_MS = 5 * 60 * 1000

export const useUiStore = defineStore('ui', () => {
  const themePreferenceCookie = useCookie<ThemePreference | null>(THEME_COOKIE_KEY)
  const themePreference = ref<ThemePreference>(themePreferenceCookie.value ?? 'light')
  const themeMode = ref<ThemeMode>(resolveInitialTheme(themePreference.value))
  const runtimeConfig = useRuntimeConfig()
  const aiAssistFeatureEnabled = Boolean(runtimeConfig.public?.features?.aiAssist)
  const aiAssistCookie = useCookie<'on' | 'off'>(AI_ASSIST_COOKIE_KEY, {
    default: () => (aiAssistFeatureEnabled ? 'on' : 'off'),
  })
  const aiAssistPreference = ref<'on' | 'off'>(
    aiAssistFeatureEnabled
      ? (aiAssistCookie.value ?? 'on')
      : 'off',
  )

  let cachedTheme: ReturnType<typeof useTheme> | null = null
  let autoThemeInterval: ReturnType<typeof globalThis.setInterval> | null = null

  const isDarkMode = computed(() => themeMode.value === 'dark')
  const aiAssistEnabled = computed(() => aiAssistFeatureEnabled && aiAssistPreference.value === 'on')

  function resolveThemeInstance() {
    if (cachedTheme) {
      return cachedTheme
    }

    try {
      cachedTheme = useTheme()
      return cachedTheme
    }
    catch {
      // Vuetify is only available client-side; swallow errors during SSR/tests.
      return null
    }
  }

  function applyVuetifyTheme(mode: ThemeMode) {
    const theme = resolveThemeInstance()
    if (!theme) {
      return
    }

    // Use new API if available, fallback to legacy API
    // Check for future Vuetify API methods that aren't in types yet
    const themeWithChange = theme as typeof theme & {
      global?: { change?: (theme: string) => void }
      change?: (theme: string) => void
    }

    if (typeof themeWithChange.global?.change === 'function') {
      themeWithChange.global.change(mode)
    }
    else if (typeof themeWithChange.change === 'function') {
      themeWithChange.change(mode)
    }
    else {
      theme.global.name.value = mode
    }
  }

  function updateAutoTheme() {
    themeMode.value = resolveAutoTheme()
  }

  function startAutoMonitoring() {
    updateAutoTheme()

    if (typeof window === 'undefined') {
      return
    }

    if (autoThemeInterval) {
      return
    }

    autoThemeInterval = globalThis.setInterval(updateAutoTheme, AUTO_THEME_INTERVAL_MS)
  }

  function stopAutoMonitoring() {
    if (autoThemeInterval) {
      clearInterval(autoThemeInterval)
      autoThemeInterval = null
    }
  }

  function setThemePreference(preference: ThemePreference) {
    if (themePreference.value === preference) {
      return
    }
    themePreference.value = preference
  }

  function setTheme(mode: ThemeMode) {
    setThemePreference(mode)
  }

  function toggleTheme() {
    if (themePreference.value === 'auto') {
      setThemePreference(themeMode.value === 'dark' ? 'light' : 'dark')
      return
    }
    setThemePreference(themePreference.value === 'dark' ? 'light' : 'dark')
  }

  function syncThemePreferenceFromUser(preference?: string | null) {
    if (!preference || !isThemePreference(preference)) {
      return
    }
    setThemePreference(preference)
  }

  function setAiAssistEnabled(enabled: boolean) {
    if (!aiAssistFeatureEnabled) return
    aiAssistPreference.value = enabled ? 'on' : 'off'
  }

  function toggleAiAssist() {
    if (!aiAssistFeatureEnabled) return
    setAiAssistEnabled(!aiAssistEnabled.value)
  }

  watch(themePreference, (preference) => {
    themePreferenceCookie.value = preference

    if (preference === 'auto') {
      startAutoMonitoring()
    }
    else {
      stopAutoMonitoring()
      themeMode.value = preference
    }
  }, { immediate: true })

  watch(themeMode, (mode) => {
    applyVuetifyTheme(mode)
  }, { immediate: true })

  watch(aiAssistPreference, (value) => {
    if (!aiAssistFeatureEnabled) {
      aiAssistCookie.value = 'off'
      return
    }
    aiAssistCookie.value = value
  }, { immediate: true })

  if (!aiAssistFeatureEnabled) {
    aiAssistCookie.value = 'off'
  }

  return {
    themeMode,
    themePreference,
    isDarkMode,
    setTheme,
    setThemePreference,
    toggleTheme,
    syncThemePreferenceFromUser,
    aiAssistEnabled,
    aiAssistFeatureEnabled,
    setAiAssistEnabled,
    toggleAiAssist,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot))
}

function resolveInitialTheme(preference: ThemePreference): ThemeMode {
  return preference === 'auto' ? resolveAutoTheme() : preference
}

function resolveAutoTheme(): ThemeMode {
  const hour = new Date().getHours()
  // Treat 7pm -> 7am as dark mode for auto preference
  return (hour >= 19 || hour < 7) ? 'dark' : 'light'
}
