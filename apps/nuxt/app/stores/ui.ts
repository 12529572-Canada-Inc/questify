import { computed, ref, watch } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useTheme } from 'vuetify'

type ThemeMode = 'light' | 'dark'

const THEME_COOKIE_KEY = 'questify-theme'

export const useUiStore = defineStore('ui', () => {
  const cookie = useCookie<ThemeMode | null>(THEME_COOKIE_KEY)
  const themeMode = ref<ThemeMode>(cookie.value ?? 'light')

  const isDarkMode = computed(() => themeMode.value === 'dark')

  function applyVuetifyTheme(mode: ThemeMode) {
    try {
      const theme = useTheme()
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
    catch {
      // Vuetify is only available client-side; swallow errors during SSR/tests.
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

  watch(themeMode, (mode) => {
    cookie.value = mode
    applyVuetifyTheme(mode)
  }, { immediate: true })

  return {
    themeMode,
    isDarkMode,
    setTheme,
    toggleTheme,
  }
})

if (import.meta.hot?.accept) {
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot))
}
