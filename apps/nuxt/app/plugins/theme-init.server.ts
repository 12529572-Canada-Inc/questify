import { useTheme } from 'vuetify'

export default defineNuxtPlugin(() => {
  try {
    const uiStore = useUiStore()
    const { themeMode } = storeToRefs(uiStore)
    const theme = useTheme()

    // Ensure server render uses the preferred theme so CSS vars match on first paint.
    if (theme?.global?.name && themeMode.value) {
      theme.global.name.value = themeMode.value
    }
  }
  catch {
    // Ignore if Vuetify context is unavailable during SSR.
  }
})
