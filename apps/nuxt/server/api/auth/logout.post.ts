import { clearUserSession } from 'auth-utils/server'

export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { success: true }
})
