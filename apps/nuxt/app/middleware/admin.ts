import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'
import { useAccessControl } from '~/composables/useAccessControl'

// Ensures that only signed-in users with admin privileges can access routes in /admin.
export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const { isAdmin } = useAccessControl()
  const { user } = storeToRefs(userStore)

  if (!user.value) {
    await userStore.fetchSession().catch(() => null)
  }

  if (!user.value) {
    return navigateTo('/auth/login')
  }

  if (!isAdmin.value) {
    return navigateTo('/quests')
  }
})
