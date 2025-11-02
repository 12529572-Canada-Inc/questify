import { computed, ref, watch } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useTheme } from 'vuetify'

type ThemeMode = 'light' | 'dark'

const THEME_COOKIE_KEY = 'questify-theme'
const AI_ASSIST_COOKIE_KEY = 'questify-ai-assist'

export const useUiStore = defineStore('ui', () => {
  const cookie = useCookie<ThemeMode | null>(THEME_COOKIE_KEY)
  const themeMode = ref<ThemeMode>(cookie.value ?? 'light')
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

  function setTheme(mode: ThemeMode) {
    if (themeMode.value === mode) {
      return
    }
    themeMode.value = mode
  }

  function toggleTheme() {
    setTheme(isDarkMode.value ? 'light' : 'dark')
  }

  function setAiAssistEnabled(enabled: boolean) {
    if (!aiAssistFeatureEnabled) return
    aiAssistPreference.value = enabled ? 'on' : 'off'
  }

  function toggleAiAssist() {
    if (!aiAssistFeatureEnabled) return
    setAiAssistEnabled(!aiAssistEnabled.value)
  }

  watch(themeMode, (mode) => {
    cookie.value = mode
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
    isDarkMode,
    setTheme,
    toggleTheme,
    aiAssistEnabled,
    aiAssistFeatureEnabled,
    setAiAssistEnabled,
    toggleAiAssist,
  }
})

if (import.meta.hot?.accept) {
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot))
}
