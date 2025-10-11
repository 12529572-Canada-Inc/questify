import { describe, it, expect, beforeAll } from 'vitest'
import { $fetch, url } from '@nuxt/test-utils'
import { setupServer } from '../utils/test-server'
import { loginAndGetCookie } from '../utils/auth-helpers'

describe('Tasks/[ID] PATCH API', () => {
//   let baseURL: string
//   let api: (path: string) => string

  beforeAll(async () => {
    await setupServer()
    // const server = await setupServer()
    // baseURL = server.baseURL
    // api = server.api
  })

  it('allows the quest owner to update their task', async () => {
    const email = `owner-${Date.now()}@example.com`
    const password = 'password123'
    const cookie = await loginAndGetCookie(email, password)
    console.log('🍪 Logged in with cookie:', cookie)

    // Attach cookie to all $fetch requests
    const questRes = await $fetch<{ quest: { id: string } }>(url('api/quests'), {
      method: 'POST',
      headers: { cookie },
      body: { title: 'Quest Title', description: 'Testing PATCH' },
    })

    const questId = questRes.quest.id

    const taskRes = await $fetch<{ task: { id: string } }>(url('api/tasks'), {
      method: 'POST',
      headers: { cookie },
      body: { questId, title: 'Initial Task', status: 'draft' },
    })

    const taskId = taskRes.task.id

    const updatedTask = await $fetch<{ task: { id: string, status: string } }>(url(`api/tasks/${taskId}`),
      {
        method: 'PATCH',
        headers: { cookie },
        body: { status: 'completed' },
      },
    )

    expect(updatedTask.task.status).toBe('completed')
  })
})
