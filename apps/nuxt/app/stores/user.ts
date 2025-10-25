import { computed, ref, watch } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const session = useUserSession()

  const user = ref<SessionUser | null>(session.user.value ?? null)
  const status = ref<'idle' | 'loading' | 'error'>('idle')
  const error = ref<unknown>(null)

  watch(session.user, (value) => {
    user.value = value ?? null
  }, { immediate: true })

  const loggedIn = computed<boolean>(() => session.loggedIn.value ?? Boolean(user.value))
  const roles = computed<string[]>(() => user.value?.roles ?? [])
  const privileges = computed<string[]>(() => user.value?.privileges ?? [])

  async function fetchSession() {
    status.value = 'loading'
    error.value = null

    try {
      await session.fetch()
      user.value = session.user.value ?? null
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
  }

  function setUser(next: SessionUser | null | undefined) {
    user.value = next ?? null
  }

  return {
    user,
    loggedIn,
    roles,
    privileges,
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
