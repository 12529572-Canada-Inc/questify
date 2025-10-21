// Ensures that only signed-in users with admin privileges can access routes in /admin.
export default defineNuxtRouteMiddleware(async () => {
  const session = useUserSession()
  const { isAdmin } = useAccessControl()

  if (!session.user.value) {
    await session.fetch()
  }

  if (!session.user.value) {
    return navigateTo('/auth/login')
  }

  if (!isAdmin.value) {
    return navigateTo('/quests')
  }
})
