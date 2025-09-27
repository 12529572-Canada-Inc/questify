import { getUserSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  return session?.user || null
})
