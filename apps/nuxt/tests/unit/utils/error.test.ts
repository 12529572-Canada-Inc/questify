import { describe, expect, it } from 'vitest'
import { resolveApiError } from '../../../app/utils/error'

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
})
