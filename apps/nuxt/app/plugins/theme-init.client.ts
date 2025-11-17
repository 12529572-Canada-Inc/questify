import { watch } from 'vue'
import { useTheme } from 'vuetify'

export default defineNuxtPlugin(() => {
  const themeCookie = useCookie<'light' | 'dark' | 'auto'>('questify-theme')
  const uiStore = useUiStore()
  const { themeMode } = storeToRefs(uiStore)

  console.log('[Client Plugin] Theme cookie:', themeCookie.value)
  console.log('[Client Plugin] Theme mode from store:', themeMode.value)

  function apply(mode: typeof themeMode.value) {
    try {
      const theme = useTheme()
      console.log('[Client Plugin] Applying theme:', mode, 'Current Vuetify theme:', theme?.global?.name?.value)
      if (theme?.global?.name && mode) {
        theme.global.name.value = mode
        console.log('[Client Plugin] Applied theme:', theme.global.name.value)
      }
    }
    catch (e) {
      console.error('[Client Plugin] Error applying theme:', e)
      // Ignore if Vuetify context is unavailable during hydration; store watch will retry.
    }
  }

  apply(themeMode.value)

  watch(themeMode, (mode) => {
    console.log('[Client Plugin] Theme mode changed to:', mode)
    apply(mode)
  })
})
