import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Quests/[ID] GET API', async () => {
  await setup({
    // test context options
  })

  it('retrieves quest by ID', async () => {
    // Step 1: Create a user
    const email = `quest-owner-${Date.now()}@example.com`
    const password = 'password123'

    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email, password, name: 'Quest Owner' },
    })

    // Step 2: Log in
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    // Step 3: Create a quest
    const questRes: { quest: { id: string } } = await $fetch('/api/quests', {
      method: 'POST',
      body: {
        title: 'Test Quest',
        description: 'Testing quest flow',
        goal: 'Complete it all',
      },
    })

    const questId = questRes.quest.id

    // Step 4: Fetch the quest by ID
    const fetchedQuest = await $fetch(`/api/quests/${questId}`, {
      method: 'GET',
    })

    // Step 5: Assert the response
    expect(fetchedQuest).toHaveProperty('id', questId)
    expect(fetchedQuest).toHaveProperty('title', 'Test Quest')
    expect(fetchedQuest).toHaveProperty('description', 'Testing quest flow')
    expect(fetchedQuest).toHaveProperty('goal', 'Complete it all')
  })
})
