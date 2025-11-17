import { watch } from 'vue'
import { useTheme } from 'vuetify'

export default defineNuxtPlugin(() => {
  const uiStore = useUiStore()
  const { themeMode, themePreference } = storeToRefs(uiStore)

  console.log('[Theme Plugin Client] Initializing. Theme preference:', themePreference.value, 'Theme mode:', themeMode.value)

  function apply(mode: typeof themeMode.value) {
    try {
      const theme = useTheme()
      console.log('[Theme Plugin Client] Applying theme:', mode, 'Current:', theme?.global?.name?.value)
      if (theme?.global?.name && mode) {
        theme.global.name.value = mode
        console.log('[Theme Plugin Client] Theme applied. New value:', theme.global.name.value)
      }
    }
    catch (e) {
      console.error('[Theme Plugin Client] Error applying theme:', e)
      // Ignore if Vuetify context is unavailable during hydration; store watch will retry.
    }
  }

  apply(themeMode.value)

  watch(themeMode, (mode) => {
    console.log('[Theme Plugin Client] Theme mode changed to:', mode)
    apply(mode)
  })
})
