import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch, useTestContext } from '@nuxt/test-utils/e2e'

let baseURL: string
const api = (path: string) => new URL(path, baseURL).toString()

describe('Tasks/[ID] PATCH API', async () => {
  beforeAll(async () => {
    await setup({})
    const ctx = useTestContext()
    baseURL = ctx.url as string
  })

  async function loginAndGetCookie(email: string, password: string): Promise<string> {
    await $fetch(api('/api/auth/signup'), {
      method: 'POST',
      body: { email, password, name: 'E2E Tester' },
    })

    const res = await fetch(api('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const cookie = res.headers.get('set-cookie')
    if (!cookie) throw new Error('No cookie returned from login')
    return cookie
  }

  it('allows the quest owner to update their task', async () => {
    const email = `owner-${Date.now()}@example.com`
    const password = 'password123'
    const cookie = await loginAndGetCookie(email, password)

    const questRes = await $fetch<{ quest: { id: string } }>(api('/api/quests'), {
      method: 'POST',
      headers: { cookie },
      body: { title: 'Quest Title', description: 'Testing PATCH' },
    })

    const questId = questRes.quest.id

    const taskRes = await $fetch<{ task: { id: string } }>(api('/api/tasks'), {
      method: 'POST',
      headers: { cookie },
      body: { questId, title: 'Initial Task', status: 'draft' },
    })

    const taskId = taskRes.task.id

    const updatedTask = await $fetch<{ task: { id: string, status: string } }>(
      api(`/api/tasks/${taskId}`),
      {
        method: 'PATCH',
        headers: { cookie },
        body: { status: 'completed' },
      },
    )

    expect(updatedTask.task.status).toBe('completed')
  })
})
