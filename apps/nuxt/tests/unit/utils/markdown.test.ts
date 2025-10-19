import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../../../app/utils/markdown'

describe('renderMarkdown', () => {
  it('returns an empty string for falsey values', () => {
    expect(renderMarkdown(undefined)).toBe('')
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown('')).toBe('')
  })

  it('renders markdown with secure link attributes', () => {
    const output = renderMarkdown('[Example](https://example.com)')
    expect(output).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">')
  })
})
