import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Quests/[ID] PATCH API', () => {
  let questId: string

  beforeAll(async () => {
    const quest = await prisma.quest.create({
      data: {
        title: 'Test Quest',
        description: 'Testing quest flow',
        status: 'draft',
        owner: {
          create: {
            email: 'quest-owner@example.com',
            password: 'hashed-password',
          },
        },
      },
    })
    questId = quest.id
  })

  afterAll(async () => {
    await prisma.quest.delete({ where: { id: questId } })
    await prisma.user.delete({ where: { email: 'quest-owner@example.com' } })
  })

  it('marks quest as completed', async () => {
    await prisma.quest.update({
      where: { id: questId },
      data: { status: 'completed' },
    })

    const quest = await prisma.quest.findUnique({ where: { id: questId } })
    expect(quest?.status).toBe('completed')
  })
})
