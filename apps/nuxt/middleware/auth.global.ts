export default defineNuxtRouteMiddleware(async (to) => {
  const { data: user, status } = useAuth()
  if (status.value === 'unauthenticated' && to.path.startsWith('/quests')) {
    return navigateTo('/auth/login')
  }
})
