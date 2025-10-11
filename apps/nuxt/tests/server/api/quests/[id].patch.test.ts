import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Quests/[ID] PATCH API', async () => {
  await setup({
    // test context options
  })

  it('allows the quest owner to update quest status', async () => {
    // Step 1: create a new user
    const email = `owner-${Date.now()}@example.com`
    const password = 'test1234'

    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email, password, name: 'Quest Owner' },
    })

    // Step 2: log in to get session cookie
    await $fetch('server/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    // Step 3: create a quest owned by this user
    const questRes: { quest: { id: string } } = await $fetch('/api/quests', {
      method: 'POST',
      body: {
        title: 'Test Quest',
        description: 'Initial quest description',
        goal: 'Finish',
      },
    })
    const questId = questRes.quest.id

    // Step 4: patch quest status
    const patchRes = await $fetch(`server/api/quests/${questId}`, {
      method: 'PATCH',
      body: { status: 'completed' },
    })

    expect(patchRes).toHaveProperty('id', questId)
    expect(patchRes).toHaveProperty('status', 'completed')
  })

  it('prevents non-owners from updating a quest', async () => {
    // Step 1: create a quest with one user
    const ownerEmail = `quest-owner-${Date.now()}@example.com`
    const password = 'password123'

    await $fetch('server/api/auth/signup', {
      method: 'POST',
      body: { email: ownerEmail, password, name: 'Owner' },
    })

    const ownerQuest: { quest: { id: string } } = await $fetch('server/api/quests', {
      method: 'POST',
      body: {
        title: 'Owner Quest',
        description: 'Owned quest description',
        goal: 'Win',
      },
    })

    const questId = ownerQuest.quest.id

    // Step 2: log in as a different user
    const intruderEmail = `intruder-${Date.now()}@example.com`

    await $fetch('server/api/auth/signup', {
      method: 'POST',
      body: { email: intruderEmail, password, name: 'Intruder' },
    })

    // Step 3: attempt to patch another user's quest
    await expect(
      $fetch(`server/api/quests/${questId}`, {
        method: 'PATCH',
        body: { status: 'completed' },
      }),
    ).rejects.toMatchObject({
      data: expect.objectContaining({
        statusCode: 403,
      }),
    })
  })
})
