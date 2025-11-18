import { resolveCloudinaryConfig, signCloudinaryParams } from '../../utils/cloudinary'

const handler = defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const config = resolveCloudinaryConfig(event)

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `${config.uploadFolder}/${user.id}`

  const signatureAlgorithm = 'sha256' as const

  // Cloudinary computes the string to sign
  // without the signature_algorithm flag.
  const signature = signCloudinaryParams(
    { folder, timestamp },
    config.apiSecret,
    signatureAlgorithm,
  )

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder,
    timestamp,
    signatureAlgorithm,
    signature,
  }
})

export default handler

export type CloudinarySignatureResponse = Awaited<ReturnType<typeof handler>>
