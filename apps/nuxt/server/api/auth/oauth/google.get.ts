import type { H3Event } from 'h3'
import { defineOAuthGoogleEventHandler } from 'nuxt-auth-utils/dist/runtime/server/lib/oauth/google.js'
import { sendRedirect } from '#imports'
import type { OAuthSuccessResult } from '../../../utils/oauth'
import { handleOAuthSuccess } from '../../../utils/oauth'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['openid', 'email', 'profile'],
  },
  async onSuccess(event, { user, tokens }) {
    const normalized = {
      id: String(user.sub ?? user.id),
      email: typeof user.email === 'string' ? user.email : undefined,
      name: typeof user.name === 'string' ? user.name : undefined,
      avatarUrl: typeof user.picture === 'string' ? user.picture : undefined,
    }

    try {
      const result = await handleOAuthSuccess(event as H3Event, 'google', normalized, tokens)
      return sendRedirect(event, resolveRedirect(result))
    }
    catch (error) {
      console.error('Google OAuth handler error:', error)
      const target = (await getUserSession(event))?.user
        ? '/settings?oauthError=google'
        : '/auth/login?oauthError=google'
      return sendRedirect(event, target)
    }
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/auth/login?oauthError=google')
  },
})

function resolveRedirect(result: OAuthSuccessResult) {
  if (result.action === 'linked') {
    return `/settings?linked=${result.provider}`
  }

  return '/dashboard'
}
