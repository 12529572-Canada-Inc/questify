import { resolveCloudinaryConfig, signCloudinaryParams } from '../../utils/cloudinary'

const handler = defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const config = resolveCloudinaryConfig(event)

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `${config.uploadFolder}/${user.id}`

  const signatureAlgorithm = 'sha256' as const

  const signature = signCloudinaryParams({
    folder,
    timestamp,
    signature_algorithm: signatureAlgorithm,
  }, config.apiSecret)

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
