import { getUserSession } from 'auth-utils/server'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  return session?.user || null
})
