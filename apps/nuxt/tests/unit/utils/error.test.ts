import { describe, expect, it } from 'vitest'
import { extractStatusCode, resolveApiError } from '../../../app/utils/error'

describe('resolveApiError', () => {
  it('prefers nested status fields and falls back appropriately', () => {
    const error = {
      data: {
        statusMessage: 'Nested message',
      },
      message: 'Outer message',
    }
    expect(resolveApiError(error, 'fallback')).toBe('Nested message')

    const errorWithoutData = {
      data: {},
      statusMessage: 'Direct status',
    }
    expect(resolveApiError(errorWithoutData, 'fallback')).toBe('Direct status')
  })

  it('returns the fallback message when no details are available', () => {
    expect(resolveApiError(null, 'fallback')).toBe('fallback')
    expect(resolveApiError({}, 'fallback')).toBe('fallback')
  })

  it('normalizes status codes from multiple sources', () => {
    expect(extractStatusCode({ data: { statusCode: 503 } })).toBe(503)
    expect(extractStatusCode({ data: { status: 418 }, statusCode: 400 })).toBe(418)
    expect(extractStatusCode({ status: 401 })).toBe(401)
    expect(extractStatusCode('oops')).toBeUndefined()
  })

  it('strips prefixed http error wrappers', () => {
    const formatted = resolveApiError({ message: '[AUTH] "Forbidden": 403   Missing scope ' }, 'fallback')
    expect(formatted).toBe('Missing scope')
  })
})
