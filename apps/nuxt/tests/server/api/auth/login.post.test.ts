import { describe, it, expect } from 'vitest'
import { loginUser } from '~/server/api/auth/login.post'
import prisma from 'shared/prisma'
import bcrypt from 'bcrypt'

describe('Auth Login API', () => {
  const email = 'login@example.com'
  const password = 'mypassword'

  beforeAll(async () => {
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: { email, password: hashed },
    })
  })

  afterAll(async () => {
    await prisma.user.delete({ where: { email } })
  })

  it('logs in a user with valid credentials', async () => {
    const session = await loginUser({ email, password })
    expect(session).toHaveProperty('id')
    expect(session).toHaveProperty('email', email)
  })

  it('rejects invalid credentials', async () => {
    await expect(
      loginUser({ email, password: 'wrongpass' }),
    ).rejects.toThrow('Invalid credentials')
  })
})
