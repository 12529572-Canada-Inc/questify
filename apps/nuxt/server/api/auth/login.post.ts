import { prisma } from 'shared/prisma'
import bcrypt from 'bcrypt'
import { setUserSession } from 'auth-utils/server'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  await setUserSession(event, { user: { id: user.id, email: user.email, name: user.name } })

  return { success: true }
})
