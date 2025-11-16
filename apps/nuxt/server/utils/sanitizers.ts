/**
 * Sanitizers shared by Nitro routes for trimming optional string inputs.
 */
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

const DEFAULT_MAX_IMAGES = 3
const DEFAULT_IMAGE_BYTES = 2 * 1024 * 1024

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || ''
  return Math.floor(base64.length * 3 / 4)
}

/**
  * Validates and normalizes image attachments passed from the client.
  */
export function sanitizeImageInputs(
  value: unknown,
  options: { maxImages?: number, maxBytes?: number, fieldLabel?: string } = {},
) {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value)) {
    throw createError({ status: 400, statusText: 'Images must be provided as an array.' })
  }

  const maxImages = options.maxImages ?? DEFAULT_MAX_IMAGES
  const maxBytes = options.maxBytes ?? DEFAULT_IMAGE_BYTES
  const fieldLabel = options.fieldLabel ?? 'image attachments'

  if (value.length > maxImages) {
    throw createError({ status: 400, statusText: `You can attach up to ${maxImages} images for ${fieldLabel}.` })
  }

  const sanitized: string[] = []

  for (const entry of value) {
    if (typeof entry !== 'string') {
      throw createError({ status: 400, statusText: `Invalid image provided for ${fieldLabel}.` })
    }

    const trimmed = entry.trim()
    if (!trimmed) {
      continue
    }

    if (trimmed.startsWith('data:image/')) {
      const size = estimateDataUrlBytes(trimmed)
      if (size > maxBytes) {
        throw createError({
          status: 400,
          statusText: `Each image for ${fieldLabel} must be under ${Math.round(maxBytes / (1024 * 1024))}MB.`,
        })
      }
      sanitized.push(trimmed)
      continue
    }

    if (trimmed.startsWith('https://')) {
      sanitized.push(trimmed)
      continue
    }

    throw createError({
      status: 400,
      statusText: `Only image uploads or HTTPS image URLs are allowed for ${fieldLabel}.`,
    })
  }

  return sanitized
}
