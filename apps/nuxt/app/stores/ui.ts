import { computed, onMounted, ref, watch } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useTheme } from 'vuetify'

type ThemeMode = 'light' | 'dark'

const THEME_COOKIE_KEY = 'questify-theme'

export const useUiStore = defineStore('ui', () => {
  const cookie = useCookie<ThemeMode | null>(THEME_COOKIE_KEY)
  const themeMode = ref<ThemeMode>(cookie.value ?? 'light')

  const isDarkMode = computed(() => themeMode.value === 'dark')

  function applyVuetifyTheme(mode: ThemeMode) {
    if (!import.meta.client) {
      return
    }

    const theme = useTheme()
    theme.global.name.value = mode
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

  onMounted(() => {
    applyVuetifyTheme(themeMode.value)
  })

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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot))
}
