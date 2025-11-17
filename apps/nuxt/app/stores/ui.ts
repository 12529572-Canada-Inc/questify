import { computed, ref, watch } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useTheme } from 'vuetify'
import type { ThemePreference } from 'shared'
import { isThemePreference } from 'shared'

type ThemeMode = 'light' | 'dark'
type ThemeInstance = ReturnType<typeof useTheme> | {
  global?: { change?: (theme: string) => void, name: { value: string } }
  change?: (theme: string) => void
}

const THEME_COOKIE_KEY = 'questify-theme'
const AI_ASSIST_COOKIE_KEY = 'questify-ai-assist'
const AUTO_THEME_INTERVAL_MS = 5 * 60 * 1000
const MAX_THEME_APPLY_RETRIES = 5

export const useUiStore = defineStore('ui', () => {
  const themePreferenceCookie = useCookie<ThemePreference | null>(THEME_COOKIE_KEY, {
    sameSite: 'lax',
    path: '/',
  })
  const themePreference = ref<ThemePreference>(themePreferenceCookie.value ?? 'light')
  const themeMode = ref<ThemeMode>(resolveInitialTheme(themePreference.value))
  const runtimeConfig = useRuntimeConfig()
  const aiAssistFeatureEnabled = Boolean(runtimeConfig.public?.features?.aiAssist)
  const aiAssistCookie = useCookie<'on' | 'off'>(AI_ASSIST_COOKIE_KEY, {
    default: () => (aiAssistFeatureEnabled ? 'on' : 'off'),
    sameSite: 'lax',
    path: '/',
  })
  const aiAssistPreference = ref<'on' | 'off'>(
    aiAssistFeatureEnabled
      ? (aiAssistCookie.value ?? 'on')
      : 'off',
  )

  let cachedTheme: ThemeInstance | null = null
  let autoThemeInterval: ReturnType<typeof globalThis.setInterval> | null = null
  let pendingThemeApply: ReturnType<typeof globalThis.setTimeout> | null = null
  let themeApplyRetries = 0
  let lastThemeAttempt: ThemeMode | null = null

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
    }

    try {
      const nuxtApp = globalThis as typeof globalThis & {
        useNuxtApp?: () => { $vuetify?: { theme?: ThemeInstance } }
        $vuetify?: { theme?: ThemeInstance }
      }
      const vuetifyTheme = nuxtApp.useNuxtApp?.()?.$vuetify?.theme ?? nuxtApp.$vuetify?.theme
      if (vuetifyTheme?.global?.name) {
        cachedTheme = vuetifyTheme as ThemeInstance
        return cachedTheme
      }
    }
    catch {
      // Nuxt app isn’t ready yet (SSR/tests).
    }

    return null
  }

  function applyVuetifyTheme(mode: ThemeMode) {
    if (mode !== lastThemeAttempt) {
      themeApplyRetries = 0
      lastThemeAttempt = mode
    }

    const theme = resolveThemeInstance()
    if (!theme) {
      if (import.meta.client && !pendingThemeApply && themeApplyRetries < MAX_THEME_APPLY_RETRIES) {
        pendingThemeApply = globalThis.setTimeout(() => {
          pendingThemeApply = null
          applyVuetifyTheme(mode)
        }, 0)
        themeApplyRetries += 1
      }
      return
    }

    themeApplyRetries = 0

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
    else if (theme.global?.name) {
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
