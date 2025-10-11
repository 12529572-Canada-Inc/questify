import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch, useTestContext, type TestContext } from '@nuxt/test-utils/e2e'
import { loginAndGetCookie } from '~/tests/utils/auth-helpers'

describe('Tasks/[ID] PATCH API', () => {
  let baseURL: string
  let api: (path: string) => string

  beforeAll(async () => {
    // 1️⃣ Setup Nuxt test environment (does NOT return anything)
    await setup({})

    // 2️⃣ Get the context explicitly
    const runtimeCtx = useTestContext() as Partial<TestContext>

    // 3️⃣ Resolve URL safely
    const urlFromCtx
      = runtimeCtx?.url
      // @ts-expect-error optional in some Nuxt versions
        || runtimeCtx?.options?.url
        || process.env.NUXT_URL

    baseURL
      = urlFromCtx && urlFromCtx.startsWith('http')
        ? urlFromCtx.endsWith('/')
          ? urlFromCtx
          : `${urlFromCtx}/`
        : 'http://127.0.0.1:3000/'

    api = (path: string) => new URL(path, baseURL).toString()
    console.log('🧩 Using baseURL:', baseURL)
  })

  it('allows the quest owner to update their task', async () => {
    const email = `owner-${Date.now()}@example.com`
    const password = 'password123'
    const cookie = await loginAndGetCookie(baseURL, email, password)

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
