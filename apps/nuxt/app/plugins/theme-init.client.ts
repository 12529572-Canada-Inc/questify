import { watch } from 'vue'
import { useTheme } from 'vuetify'

export default defineNuxtPlugin(() => {
  const uiStore = useUiStore()
  const { themeMode } = storeToRefs(uiStore)

  function apply(mode: typeof themeMode.value) {
    try {
      const theme = useTheme()
      if (theme?.global?.name && mode) {
        theme.global.name.value = mode
      }
    }
    catch {
      // Ignore if Vuetify context is unavailable during hydration; store watch will retry.
    }
  }

  apply(themeMode.value)

  watch(themeMode, (mode) => {
    apply(mode)
  })
})
