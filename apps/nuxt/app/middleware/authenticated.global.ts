type MiddlewareFn = (to: { path: string }, from?: unknown) => Promise<unknown> | unknown

const registerMiddleware = (globalThis as { defineNuxtRouteMiddleware?: (fn: MiddlewareFn) => MiddlewareFn }).defineNuxtRouteMiddleware
  ?? ((fn: MiddlewareFn) => fn)

const authenticatedMiddleware: MiddlewareFn = async (to) => {
  const { loggedIn, fetch } = useUserSession()

  // Refresh session state if needed
  await fetch()

  // Only protect /quests routes (except /quests/public for example)
  if (to.path === '/quests/new') {
    return
  }

  if (to.path.startsWith('/quests') && !loggedIn.value) {
    return navigateTo('/auth/login')
  }
}

export default registerMiddleware(authenticatedMiddleware)
