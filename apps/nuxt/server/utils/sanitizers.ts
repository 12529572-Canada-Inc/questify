export function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function sanitizeOptionalTextInput(
  value: unknown,
  fieldLabel: string,
) {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({ status: 400, statusText: `Invalid ${fieldLabel}` })
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
