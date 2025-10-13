import { PrismaClient } from '@prisma/client'
import { verifyPassword } from 'shared'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const { email, password } = body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const ok = verifyPassword(password, user.password)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  // set session
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name || null,
    },
  })

  return {
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  }
})
