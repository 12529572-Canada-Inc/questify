import { resolveCloudinaryConfig, signCloudinaryParams } from '../../utils/cloudinary'

const handler = defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const config = resolveCloudinaryConfig(event)

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `${config.uploadFolder}/${user.id}`

  const signature = signCloudinaryParams({
    folder,
    timestamp,
  }, config.apiSecret)

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder,
    timestamp,
    signature,
  }
})

export default handler

export type CloudinarySignatureResponse = Awaited<ReturnType<typeof handler>>
