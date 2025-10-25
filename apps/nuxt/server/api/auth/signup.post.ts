import { PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'
import { hashPassword } from 'shared/server'
import { ensureSuperAdmin } from '#prisma-utils/accessControl'
import { attachSessionWithAccess } from '../../utils/access-control'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = (await readBody<SignupBody>(event)) || {} as SignupBody
  const { email, password, name } = body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ status: 409, statusText: 'User already exists' })
  }

  const hashed = hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
    },
  })

  // Ensure at least one SuperAdmin exists after a new signup
  await ensureSuperAdmin(prisma)

  const profile = await attachSessionWithAccess(event as unknown as H3Event, {
    id: user.id,
    email: user.email,
    name: user.name || null,
  })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: profile.roles,
      privileges: profile.privileges,
    },
  }
})
