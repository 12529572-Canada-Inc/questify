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
const DEFAULT_IMAGE_BYTES = 1.5 * 1024 * 1024 // 1.5MB per image
const DEFAULT_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024 // 24MB combined cap

function resolveMaxImageBytes(explicitMax?: number) {
  if (typeof explicitMax === 'number' && Number.isFinite(explicitMax) && explicitMax > 0) {
    return explicitMax
  }

  const configured = Number(process.env.NUXT_PUBLIC_IMAGE_MAX_SIZE_BYTES ?? DEFAULT_IMAGE_BYTES)
  if (Number.isFinite(configured) && configured > 0) {
    return configured
  }

  return DEFAULT_IMAGE_BYTES
}

function resolveMaxTotalImageBytes(explicitMax?: number) {
  if (typeof explicitMax === 'number' && Number.isFinite(explicitMax) && explicitMax > 0) {
    return explicitMax
  }

  const configured = Number(process.env.NUXT_PUBLIC_IMAGE_TOTAL_MAX_BYTES ?? DEFAULT_TOTAL_IMAGE_BYTES)
  if (Number.isFinite(configured) && configured > 0) {
    return configured
  }

  return DEFAULT_TOTAL_IMAGE_BYTES
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || ''
  return Math.floor(base64.length * 3 / 4)
}

/**
  * Validates and normalizes image attachments passed from the client.
  */
export function sanitizeImageInputs(
  value: unknown,
  options: { maxImages?: number, maxBytes?: number, maxTotalBytes?: number, fieldLabel?: string } = {},
) {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value)) {
    throw createError({ status: 400, statusText: 'Images must be provided as an array.' })
  }

  const maxImages = options.maxImages ?? DEFAULT_MAX_IMAGES
  const maxBytes = resolveMaxImageBytes(options.maxBytes)
  const maxTotalBytes = resolveMaxTotalImageBytes(options.maxTotalBytes)
  const fieldLabel = options.fieldLabel ?? 'image attachments'

  if (value.length > maxImages) {
    throw createError({ status: 400, statusText: `You can attach up to ${maxImages} images for ${fieldLabel}.` })
  }

  const sanitized: string[] = []
  let totalBytes = 0

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
      if (totalBytes + size > maxTotalBytes) {
        throw createError({
          status: 400,
          statusText: `Combined images for ${fieldLabel} must stay under ${Math.round(maxTotalBytes / (1024 * 1024))}MB.`,
        })
      }
      totalBytes += size
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
