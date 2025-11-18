import crypto from 'node:crypto'

type RuntimeConfigEvent = Parameters<typeof useRuntimeConfig>[0]

type CloudinaryConfig = {
  cloudName: string
  apiKey: string
  apiSecret: string
  uploadFolder: string
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function resolveCloudinaryConfig(event: RuntimeConfigEvent): CloudinaryConfig {
  const runtimeConfig = useRuntimeConfig(event)
  const cloudinary = runtimeConfig.cloudinary ?? {}

  const cloudName = normalize(cloudinary.cloudName)
  const apiKey = normalize(cloudinary.apiKey)
  const apiSecret = normalize(cloudinary.apiSecret)
  const uploadFolder = normalize(cloudinary.uploadFolder) || 'questify/quests'

  if (!cloudName || !apiKey || !apiSecret) {
    throw createError({
      status: 503,
      statusText: 'Image uploads are not configured for this environment.',
    })
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadFolder,
  }
}

export function signCloudinaryParams(
  params: Record<string, string | number | boolean | undefined | null>,
  apiSecret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256',
) {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  // Cloudinary signs with a hash of the string-to-sign followed by the API secret.
  return crypto.createHash(algorithm).update(`${filtered}${apiSecret}`).digest('hex')
}
