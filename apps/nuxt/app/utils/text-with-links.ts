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

const urlPattern = /https?:\/\/[^\s<>"]+/g
const trailingCharacters = new Set(['.', ',', '!', '?', ';', ':', '\'', '"', ')', ']', '}'])
const closingToOpeningMap: Record<string, string> = {
  ')': '(',
  ']': '[',
  '}': '{',
}

function countCharacter(value: string, char: string) {
  let count = 0

  for (const current of value) {
    if (current === char)
      count++
  }

  return count
}

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

    const trailingChars: string[] = []

    while (url.length > 0) {
      const lastChar = url.charAt(url.length - 1)

      if (!trailingCharacters.has(lastChar))
        break

      const openingChar = closingToOpeningMap[lastChar]

      if (openingChar) {
        const candidate = url.slice(0, -1)
        const openCount = countCharacter(candidate, openingChar)
        const closeCount = countCharacter(candidate, lastChar)

        if (closeCount < openCount)
          break
      }

      trailingChars.push(lastChar)
      url = url.slice(0, -1)
    }

    trailing = trailingChars.reverse().join('')

    if (!url) {
      url = fullMatch
      trailing = ''
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
