import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeOptionalString, sanitizeOptionalTextInput } from '../../../server/utils/sanitizers'

const globalWithMocks = globalThis as typeof globalThis & {
  createError?: (payload: { status?: number, statusText?: string }) => Error
}

describe('server sanitizers', () => {
  let originalCreateError: typeof globalWithMocks.createError

  beforeEach(() => {
    originalCreateError = globalWithMocks.createError
    globalWithMocks.createError = vi.fn(({ statusText }) => new Error(statusText ?? 'Invalid field')) as typeof globalWithMocks.createError
  })

  afterEach(() => {
    if (originalCreateError) {
      globalWithMocks.createError = originalCreateError
    }
    else {
      delete globalWithMocks.createError
    }
  })

  describe('normalizeOptionalString', () => {
    it('returns trimmed strings or null', () => {
      expect(normalizeOptionalString('  hello  ')).toBe('hello')
      expect(normalizeOptionalString('   ')).toBeNull()
      expect(normalizeOptionalString(undefined)).toBeNull()
      expect(normalizeOptionalString(null)).toBeNull()
    })
  })

  describe('sanitizeOptionalTextInput', () => {
    it('preserves undefined and null values', () => {
      expect(sanitizeOptionalTextInput(undefined, 'details')).toBeUndefined()
      expect(sanitizeOptionalTextInput(null, 'details')).toBeNull()
    })

    it('returns trimmed text or null when empty', () => {
      expect(sanitizeOptionalTextInput('  notes  ', 'details')).toBe('notes')
      expect(sanitizeOptionalTextInput('   ', 'details')).toBeNull()
    })

    it('throws when the value is not a string', () => {
      expect(() => sanitizeOptionalTextInput(42 as unknown, 'details')).toThrow('Invalid details')
    })
  })
})
