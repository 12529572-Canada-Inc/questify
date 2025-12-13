import { describe, expect, it } from 'vitest'
import { isOAuthProvider, SUPPORTED_OAUTH_PROVIDERS } from '../src/auth'

describe('auth', () => {
  it('accepts only supported oauth providers', () => {
    for (const provider of SUPPORTED_OAUTH_PROVIDERS) {
      expect(isOAuthProvider(provider)).toBe(true)
    }

    expect(isOAuthProvider('github')).toBe(false)
    expect(isOAuthProvider('')).toBe(false)
  })
})
