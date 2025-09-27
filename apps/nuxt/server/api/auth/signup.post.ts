import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { email, password, name } = await readBody(event)

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  })

  return { user: { id: user.id, email: user.email, name: user.name } }
})
