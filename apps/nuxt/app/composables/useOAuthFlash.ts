import type { OAuthProvider } from 'shared'

export type OAuthFlashAction = 'linked' | 'signed-in' | 'created'

interface OAuthFlashPayload {
  provider: OAuthProvider
  action: OAuthFlashAction
}

export function useOAuthFlash() {
  const cookie = useCookie<string | null>('oauth_result')

  function consumeOAuthFlash(): OAuthFlashPayload | null {
    const value = cookie.value
    if (!value) {
      return null
    }

    try {
      const parsed = JSON.parse(value) as Partial<OAuthFlashPayload>
      if (parsed && parsed.provider && parsed.action) {
        return parsed as OAuthFlashPayload
      }
    }
    catch (error) {
      console.warn('Failed to parse OAuth flash cookie:', error)
    }
    finally {
      cookie.value = null
    }

    return null
  }

  return { consumeOAuthFlash }
}
