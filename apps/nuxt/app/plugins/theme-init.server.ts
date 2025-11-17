export default defineNuxtPlugin(() => {
  // Read theme cookie directly during SSR
  const uiStore = useUiStore()
  const { themeMode } = storeToRefs(uiStore)

  console.log('[SSR] Theme mode:', themeMode.value)

  // Inject theme mode into HTML attributes for CSS styling during SSR
  useHead({
    htmlAttrs: {
      'data-theme': themeMode.value,
      class: `theme--${themeMode.value}`,
    },
  })
})
