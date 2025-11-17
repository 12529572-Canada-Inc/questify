import { computed, ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ThemePreference } from 'shared'
import { isThemePreference } from 'shared'
import { useUserStore } from '~/stores/user'
import { useUiStore } from '~/stores/ui'

interface UserProfile {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  themePreference: ThemePreference
  roles: string[]
  privileges: string[]
  providers: string[]
  createdAt?: string
  updatedAt?: string
}

interface UpdateProfilePayload {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  themePreference?: ThemePreference | null
}

export const useProfileStore = defineStore('profile', () => {
  const userStore = useUserStore()
  const uiStore = useUiStore()

  const profile = ref<UserProfile | null>(null)
  const status = ref<'idle' | 'loading' | 'error'>('idle')
  const saving = ref(false)
  const error = ref<unknown>(null)
  const saveError = ref<unknown>(null)

  const hasProfile = computed(() => profile.value !== null)

  async function fetchProfile() {
    status.value = 'loading'
    error.value = null

    try {
      const data = await $fetch<UserProfile>('/api/users/me')
      applyProfile(data)
      status.value = 'idle'
      return data
    }
    catch (err) {
      error.value = err
      status.value = 'error'
      throw err
    }
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    saving.value = true
    saveError.value = null

    try {
      const result = await $fetch<{ success: boolean, user: UserProfile }>('/api/users/me', {
        method: 'PUT',
        body: payload,
      })

      // Force theme sync when user explicitly saves profile
      applyProfile(result.user)
      saving.value = false
      return result.user
    }
    catch (err) {
      saveError.value = err
      saving.value = false
      throw err
    }
  }

  function applyProfile(data: UserProfile) {
    const themePreference = isThemePreference(data.themePreference) ? data.themePreference : 'light'

    profile.value = {
      ...data,
      themePreference,
    }

    uiStore.syncThemePreferenceFromUser(themePreference)

    userStore.setUser({
      id: data.id,
      email: data.email,
      name: data.name ?? undefined,
      avatarUrl: data.avatarUrl ?? undefined,
      themePreference,
      roles: data.roles,
      privileges: data.privileges,
      providers: data.providers,
    })
  }

  function reset() {
    profile.value = null
    status.value = 'idle'
    saving.value = false
    error.value = null
    saveError.value = null
  }

  return {
    profile,
    status,
    saving,
    error,
    saveError,
    hasProfile,
    fetchProfile,
    updateProfile,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot))
}
