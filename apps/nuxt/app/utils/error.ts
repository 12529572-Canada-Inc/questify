const HTTP_ERROR_PATTERN = /^\[[A-Z]+\]\s+"[^"]+"\s*:\s*\d+\s*(.*)$/

function normalizeMessage(message: string | undefined, fallback: string) {
  if (!message) {
    return fallback
  }

  const trimmed = message.trim()

  if (!trimmed) {
    return fallback
  }

  const match = trimmed.match(HTTP_ERROR_PATTERN)

  if (match) {
    const extracted = match[1]?.trim()
    return extracted && extracted.length > 0 ? extracted : fallback
  }

  return trimmed
}

export function extractStatusCode(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') {
    return undefined
  }

  const source = err as Record<string, unknown>
  const data = source['data']
  const dataRecord = typeof data === 'object' && data !== null
    ? data as Record<string, unknown>
    : undefined

  const pickNumber = (value: unknown) => (typeof value === 'number' ? value : undefined)

  const candidates = [
    pickNumber(dataRecord?.statusCode),
    pickNumber(dataRecord?.status),
    pickNumber(source['statusCode']),
    pickNumber(source['status']),
  ]

  return candidates.find((candidate): candidate is number => typeof candidate === 'number')
}

export function resolveApiError(err: unknown, fallbackMessage: string) {
  if (err && typeof err === 'object') {
    const source = err as Record<string, unknown>
    const dataValue = source['data']
    const data = typeof dataValue === 'object' && dataValue !== null
      ? dataValue as Record<string, unknown>
      : undefined

    const pickString = (target: Record<string, unknown> | undefined, key: string) => {
      const value = target?.[key]
      return typeof value === 'string' ? value : undefined
    }

    const message = (
      pickString(data, 'statusMessage')
      ?? pickString(data, 'statusText')
      ?? pickString(data, 'message')
      ?? pickString(source, 'statusMessage')
      ?? pickString(source, 'message')
      ?? fallbackMessage
    )

    return normalizeMessage(message, fallbackMessage)
  }

  return fallbackMessage
}
