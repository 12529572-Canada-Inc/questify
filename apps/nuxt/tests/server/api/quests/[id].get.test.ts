// TODO: Fix tests once upgrade to Nuxt 4 is complete
import { $fetch } from '@nuxt/test-utils/e2e'
import { setupServer } from '../utils/server'
import { loginAndGetCookie } from '../utils/auth'

describe.skip('Quests/[ID] GET API', async () => {
  beforeAll(async () => {
    await setupServer()
  })

  it('retrieves quest by ID', async () => {
    const email = `owner-${Date.now()}@example.com`
    const password = 'password123'
    const cookie = await loginAndGetCookie(email, password)
    console.log('🍪 Logged in with cookie:', cookie)

    const questRes: { quest: { id: string } } = await $fetch('/api/quests', {
      method: 'POST',
      body: {
        title: 'Test Quest',
        goal: 'Complete it all',
        context: 'Testing quest flow',
      },
    })

    const questId = questRes.quest.id

    // Step 4: Fetch the quest by ID
    const fetchedQuest = await $fetch(`/api/quests/${questId}`, {
      method: 'GET',
      headers: { cookie },
    })

    // Step 5: Assert the response
    expect(fetchedQuest).toHaveProperty('id', questId)
    expect(fetchedQuest).toHaveProperty('title', 'Test Quest')
    expect(fetchedQuest).toHaveProperty('goal', 'Complete it all')
    expect(fetchedQuest).toHaveProperty('context', 'Testing quest flow')
  })
})
