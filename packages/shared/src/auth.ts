export const SUPPORTED_OAUTH_PROVIDERS = ['google', 'facebook'] as const

export type OAuthProvider = typeof SUPPORTED_OAUTH_PROVIDERS[number]

export function isOAuthProvider(provider: string): provider is OAuthProvider {
  return (SUPPORTED_OAUTH_PROVIDERS as readonly string[]).includes(provider)
}
