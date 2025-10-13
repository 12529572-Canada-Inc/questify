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

  it('returns an empty array when the text is missing', () => {
    expect(splitTextIntoSegments(undefined)).toEqual([])
    expect(splitTextIntoSegments(null)).toEqual([])
    expect(splitTextIntoSegments('')).toEqual([])
  })
})
