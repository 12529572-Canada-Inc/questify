import type { H3Event } from 'h3'
// @ts-expect-error - nuxt-auth-utils internal path lacks type exports
import { defineOAuthFacebookEventHandler } from 'nuxt-auth-utils/runtime/server/lib/oauth/facebook'
import type { OAuthSuccessResult } from '../../../utils/oauth'
import { handleOAuthSuccess } from '../../../utils/oauth'

// defineOAuthFacebookEventHandler is auto-imported by nuxt-auth-utils

export default defineOAuthFacebookEventHandler({
  config: {
    scope: ['email', 'public_profile'],
    fields: ['id', 'name', 'email'],
  },
  async onSuccess(event, { user, tokens }) {
    const normalized = {
      id: String(user.id),
      email: typeof user.email === 'string' ? user.email : undefined,
      name: typeof user.name === 'string' ? user.name : undefined,
    }

    try {
      const result = await handleOAuthSuccess(event as H3Event, 'facebook', normalized, tokens)
      return sendRedirect(event, resolveRedirect(result))
    }
    catch (error) {
      console.error('Facebook OAuth handler error:', error)
      const target = (await getUserSession(event))?.user
        ? '/settings?oauthError=facebook'
        : '/auth/login?oauthError=facebook'
      return sendRedirect(event, target)
    }
  },
  onError(event, error) {
    console.error('Facebook OAuth error:', error)
    return sendRedirect(event, '/auth/login?oauthError=facebook')
  },
})

function resolveRedirect(result: OAuthSuccessResult) {
  if (result.action === 'linked') {
    return `/settings?linked=${result.provider}`
  }

  return '/dashboard'
}
