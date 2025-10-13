export interface TextSegment {
  type: 'text'
  value: string
}

export interface LinkSegment {
  type: 'link'
  value: string
  display: string
}

export type Segment = TextSegment | LinkSegment

const urlPattern = /https?:\/\/[^\s<>")\]\}]+/g
const trailingPunctuationPattern = /[.,!?;:'"\)\]\}]+$/

export function summarizeUrl(url: string) {
  try {
    const { hostname } = new URL(url)
    return hostname.replace(/^www\./, '')
  }
  catch {
    return url
  }
}

export function splitTextIntoSegments(input?: string | null): Segment[] {
  if (!input)
    return []

  const text = input
  const result: Segment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(urlPattern)) {
    const fullMatch = match[0]
    const startIndex = match.index ?? 0

    if (startIndex > lastIndex) {
      result.push({ type: 'text', value: text.slice(lastIndex, startIndex) })
    }

    let url = fullMatch
    let trailing = ''

    const trailingMatch = url.match(trailingPunctuationPattern)

    if (trailingMatch) {
      trailing = trailingMatch[0]
      url = url.slice(0, -trailing.length)

      if (!url) {
        url = fullMatch
        trailing = ''
      }
    }

    result.push({ type: 'link', value: url, display: summarizeUrl(url) })

    if (trailing) {
      result.push({ type: 'text', value: trailing })
    }

    lastIndex = startIndex + fullMatch.length
  }

  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return result
}
