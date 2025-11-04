import { computed, ref, watch } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ThemePreference, isThemePreference } from 'shared'
import { useUiStore } from '~/stores/ui'

export const useUserStore = defineStore('user', () => {
  const session = useUserSession()
  const uiStore = useUiStore()

  const user = ref<SessionUser | null>(session.user.value ?? null)
  const status = ref<'idle' | 'loading' | 'error'>('idle')
  const error = ref<unknown>(null)

  watch(session.user, (value) => {
    user.value = value ?? null
    uiStore.syncThemePreferenceFromUser(value?.themePreference ?? null)
  }, { immediate: true })

  const loggedIn = computed<boolean>(() => session.loggedIn.value ?? Boolean(user.value))
  const roles = computed<string[]>(() => user.value?.roles ?? [])
  const privileges = computed<string[]>(() => user.value?.privileges ?? [])
  const providers = computed<string[]>(() => user.value?.providers ?? [])
  const avatarUrl = computed<string | null>(() => user.value?.avatarUrl ?? null)
  const themePreference = computed<ThemePreference>(() => {
    const preference = user.value?.themePreference
    return isThemePreference(preference) ? preference : 'light'
  })

  async function fetchSession() {
    status.value = 'loading'
    error.value = null

    try {
      await session.fetch()
      user.value = session.user.value ?? null
      uiStore.syncThemePreferenceFromUser(user.value?.themePreference ?? null)
      status.value = 'idle'
      return user.value
    }
    catch (err) {
      error.value = err
      status.value = 'error'
      throw err
    }
  }

  async function clearSession() {
    await session.clear()
    user.value = null
    uiStore.syncThemePreferenceFromUser(null)
  }

  function setUser(next: SessionUser | null | undefined) {
    user.value = next ?? null
    uiStore.syncThemePreferenceFromUser(user.value?.themePreference ?? null)
  }

  return {
    user,
    loggedIn,
    roles,
    privileges,
    providers,
    avatarUrl,
    themePreference,
    status,
    error,
    fetchSession,
    clearSession,
    setUser,
  }
})

if (import.meta.hot?.accept) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
