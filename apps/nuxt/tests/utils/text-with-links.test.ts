import { describe, expect, it } from 'vitest'
import { splitTextIntoSegments } from '~/utils/text-with-links'

describe('splitTextIntoSegments', () => {
  it('removes trailing punctuation from detected URLs while preserving it in the text', () => {
    const segments = splitTextIntoSegments('Visit https://example.com.')

    expect(segments).toEqual([
      { type: 'text', value: 'Visit ' },
      { type: 'link', value: 'https://example.com', display: 'example.com' },
      { type: 'text', value: '.' },
    ])
  })

  it('handles closing punctuation like parentheses next to URLs', () => {
    const segments = splitTextIntoSegments('See (https://example.org)!')

    expect(segments).toEqual([
      { type: 'text', value: 'See (' },
      { type: 'link', value: 'https://example.org', display: 'example.org' },
      { type: 'text', value: ')!' },
    ])
  })

  it('keeps closing brackets that are part of the actual URL', () => {
    const segments = splitTextIntoSegments(
      'Reference https://en.wikipedia.org/wiki/Parenthesis_(mathematics)',
    )

    expect(segments).toEqual([
      { type: 'text', value: 'Reference ' },
      {
        type: 'link',
        value: 'https://en.wikipedia.org/wiki/Parenthesis_(mathematics)',
        display: 'en.wikipedia.org',
      },
    ])
  })

  it('returns an empty array when the text is missing', () => {
    expect(splitTextIntoSegments(undefined)).toEqual([])
    expect(splitTextIntoSegments(null)).toEqual([])
    expect(splitTextIntoSegments('')).toEqual([])
  })
})
