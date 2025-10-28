import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'

// Protects routes that require an authenticated session.
export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const { loggedIn } = storeToRefs(userStore)

  if (!loggedIn.value) {
    await userStore.fetchSession().catch(() => null)
  }

  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }
})
