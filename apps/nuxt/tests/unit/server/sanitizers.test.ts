import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeOptionalString, sanitizeImageInputs, sanitizeOptionalTextInput } from '../../../server/utils/sanitizers'

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

  describe('sanitizeImageInputs', () => {
    const smallPng = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

    it('returns an empty array for undefined or null', () => {
      expect(sanitizeImageInputs(undefined)).toEqual([])
      expect(sanitizeImageInputs(null)).toEqual([])
    })

    it('accepts data URLs and https URLs within limits', () => {
      const result = sanitizeImageInputs([smallPng, 'https://example.com/image.png'])
      expect(result).toEqual([smallPng, 'https://example.com/image.png'])
    })

    it('throws when more than max images are provided', () => {
      expect(() => sanitizeImageInputs([smallPng, smallPng, smallPng, smallPng], { maxImages: 3 }))
        .toThrow('You can attach up to 3 images for image attachments.')
    })

    it('throws when an entry is not a string', () => {
      expect(() => sanitizeImageInputs([smallPng, 123 as unknown as string])).toThrow('Invalid image provided for image attachments.')
    })

    it('throws when a data URL exceeds size limit', () => {
      const largeDataUrl = 'data:image/png;base64,' + 'A'.repeat(200) // ~150 bytes > limit below
      expect(() => sanitizeImageInputs([largeDataUrl], { maxBytes: 50 }))
        .toThrow('Each image for image attachments must be under 0MB.')
    })

    it('throws when a URL is not https or data URL', () => {
      expect(() => sanitizeImageInputs(['http://example.com/image.png'])).toThrow('Only image uploads or HTTPS image URLs are allowed for image attachments.')
    })
  })
})
