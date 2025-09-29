import { describe, it, expect } from 'vitest'
import { createUser } from '~/server/api/auth/signup.post'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

describe('Auth Signup API', () => {
  it('creates a new user with hashed password', async () => {
    const email = 'test@example.com'
    const password = 'password123'

    const user = await createUser({ email, password })

    expect(user.email).toBe(email)
    expect(user.password).not.toBe(password) // hashed
    expect(await bcrypt.compare(password, user.password)).toBe(true)

    // cleanup
    await prisma.user.delete({ where: { email } })
  })

  it('fails when email already exists', async () => {
    const email = 'duplicate@example.com'
    const password = 'password123'

    await createUser({ email, password })

    await expect(createUser({ email, password })).rejects.toThrow()

    // cleanup
    await prisma.user.delete({ where: { email } })
  })
})
