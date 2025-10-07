import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Quests/[ID] GET API', () => {
  let questId: string

  beforeAll(async () => {
    const quest = await prisma.quest.create({
      data: {
        title: 'Test Quest',
        description: 'Testing quest flow',
        status: 'draft',
        owner: {
          create: {
            email: `quest-owner-${Date.now()}@example.com`,
            password: 'hashed-password',
          },
        },
      },
    })
    questId = quest.id
  })

  afterAll(async () => {
    if (questId) {
      await prisma.quest.delete({ where: { id: questId } })
    }
    await prisma.user.deleteMany({ where: { email: { contains: 'quest-owner@' } } })
  })

  it('retrieves quest by ID', async () => {
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: { tasks: true },
    })
    expect(quest?.id).toBe(questId)
    expect(quest?.title).toBe('Test Quest')
  })
})
