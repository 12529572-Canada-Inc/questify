export function resolveApiError(err: unknown, fallbackMessage: string) {
  if (err && typeof err === 'object') {
    const source = err as Record<string, unknown>
    const data = source['data'] as Record<string, unknown> | undefined

    const pickString = (target: Record<string, unknown> | undefined, key: string) => {
      const value = target?.[key]
      return typeof value === 'string' ? value : undefined
    }

    return (
      pickString(data, 'statusMessage')
      ?? pickString(data, 'statusText')
      ?? pickString(data, 'message')
      ?? pickString(source, 'statusMessage')
      ?? pickString(source, 'message')
      ?? fallbackMessage
    )
  }

  return fallbackMessage
}
