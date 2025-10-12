// TODO: Fix tests once upgrade to Nuxt 4 is complete
import { $fetch } from '@nuxt/test-utils/e2e'
import { setupServer } from '../utils/server'
import { loginAndGetCookie } from '../utils/auth'

describe.skip('Quests/[ID] PATCH API', async () => {
  beforeAll(async () => {
    await setupServer()
  })

  it('allows the quest owner to update quest status', async () => {
    const email = `owner-${Date.now()}@example.com`
    const password = 'password123'
    const cookie = await loginAndGetCookie(email, password)
    console.log('🍪 Logged in with cookie:', cookie)

    const questRes: { quest: { id: string } } = await $fetch('/api/quests', {
      method: 'POST',
      headers: { cookie },
      body: {
        title: 'Test Quest',
        description: 'Initial quest description',
        goal: 'Finish',
      },
    })
    const questId = questRes.quest.id

    // Step 4: patch quest status
    const patchRes = await $fetch(`/api/quests/${questId}`, {
      method: 'PATCH',
      headers: { cookie },
      body: { status: 'completed' },
    })

    expect(patchRes).toHaveProperty('id', questId)
    expect(patchRes).toHaveProperty('status', 'completed')
  })

  it('prevents non-owners from updating a quest', async () => {
    const email = `owner-${Date.now()}@example.com`
    const password = 'password123'
    const cookie = await loginAndGetCookie(email, password)
    console.log('🍪 Logged in with cookie:', cookie)

    const ownerQuest: { quest: { id: string } } = await $fetch('/api/quests', {
      method: 'POST',
      headers: { cookie },
      body: {
        title: 'Owner Quest',
        description: 'Owned quest description',
        goal: 'Win',
      },
    })

    const questId = ownerQuest.quest.id

    // Step 2: log in as a different user
    const intruderEmail = `intruder-${Date.now()}@example.com`

    await $fetch('api/auth/signup', {
      method: 'POST',
      body: { email: intruderEmail, password, name: 'Intruder' },
    })

    // Step 3: attempt to patch another user's quest
    await expect(
      $fetch(`/api/quests/${questId}`, {
        method: 'PATCH',
        body: { status: 'completed' },
      }),
    ).rejects.toMatchObject({
      data: expect.objectContaining({
        statusCode: 403,
      }),
    })
  })

  it('reopens a quest and resets completed tasks to todo', async () => {
    // TODO: Implement test
  })

  it('completes a quest and propagates the status to every task', async () => {
    // TODO: Implement test
  })

  it('rejects invalid quest statuses', async () => {
    // TODO: Implement test
  })
})
