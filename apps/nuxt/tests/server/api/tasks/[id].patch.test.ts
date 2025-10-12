// TODO: Fix tests once upgrade to Nuxt 4 is complete
import { loginAndGetCookie } from '../utils/auth'
import { setupServer } from '../utils/server'

describe.skip('Tasks/[ID] PATCH API', () => {
  beforeAll(async () => {
    await setupServer()
  })

  it('allows the task owner to update their task', async () => {
    const email = `owner-${Date.now()}@example.com`
    const password = 'password123'
    const cookie = await loginAndGetCookie(email, password)
    console.log('🍪 Logged in with cookie:', cookie)

    const questRes = await $fetch<{ quest: { id: string } }>(`/api/quests`, {
      method: 'POST',
      headers: { cookie },
      body: { title: 'Quest Title', description: 'Testing PATCH' },
    })

    const questId = questRes.quest.id

    const taskRes = await $fetch<{ task: { id: string } }>(`/api/tasks`, {
      method: 'POST',
      headers: { cookie },
      body: { questId, title: 'Initial Task', status: 'draft' },
    })

    const taskId = taskRes.task.id

    const updatedTask = await $fetch<{ task: { id: string, status: string } }>(`/api/tasks/${taskId}`,
      {
        method: 'PATCH',
        headers: { cookie },
        body: { status: 'completed' },
      },
    )

    expect(updatedTask.task.status).toBe('completed')
  })

  it('allows the task owner to revert a task to an unfinished state', async () => {
    // TODO: Implement test
  })

  it('rejects invalid task statuses', async () => {
    // TODO: Implement test
  })
})
