import type { H3Event } from 'h3'

export default defineEventHandler(async (event) => {
  await clearUserSession(event as unknown as H3Event)
  return { success: true }
})
