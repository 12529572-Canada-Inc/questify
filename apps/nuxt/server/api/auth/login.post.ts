import { prisma } from 'shared/prisma'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  // Return the user object minimal shape
  return { id: user.id, email: user.email, name: user.name }
})
