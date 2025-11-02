import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'

type MiddlewareFn = (to: { path: string }, from?: unknown) => Promise<unknown> | unknown

const registerMiddleware = (globalThis as { defineNuxtRouteMiddleware?: (fn: MiddlewareFn) => MiddlewareFn }).defineNuxtRouteMiddleware
  ?? ((fn: MiddlewareFn) => fn)

const authenticatedMiddleware: MiddlewareFn = async (to) => {
  const userStore = useUserStore()
  const { loggedIn } = storeToRefs(userStore)

  try {
    await userStore.fetchSession()
  }
  catch (e) {
    console.error('Failed to refresh session in authenticated middleware:', e)
  }

  // Only protect /quests routes (except /quests/public for example)
  if (to.path === '/quests/new') {
    return
  }

  if (to.path === '/quests/public' || to.path.startsWith('/quests/public/')) {
    return
  }

  if (to.path.startsWith('/quests') && !loggedIn.value) {
    return navigateTo('/auth/login')
  }
}

export default registerMiddleware(authenticatedMiddleware)
