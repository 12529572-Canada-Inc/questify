import { useAuth } from 'auth-utils'

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = useAuth()

  if (!session.value && to.path.startsWith('/quests')) {
    return navigateTo('/auth/login')
  }
})
