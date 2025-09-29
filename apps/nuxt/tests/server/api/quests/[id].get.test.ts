import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from 'shared/prisma'

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

  it('retrieves quest by ID', async () => {
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: { tasks: true },
    })
    expect(quest?.id).toBe(questId)
    expect(quest?.title).toBe('Test Quest')
  })
})
