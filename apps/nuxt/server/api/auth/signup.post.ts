import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'shared'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody<SignupBody>(event)
  const { email, password, name } = body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'User already exists' })
  }

  const hashed = hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
    },
  })

  // set the session
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name || null,
    },
    // optionally add extra fields
  })

  return {
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  }
})
