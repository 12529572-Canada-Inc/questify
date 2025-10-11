import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch, useTestContext } from '@nuxt/test-utils/e2e'

let baseURL: string

describe('Tasks/[ID] PATCH API', async () => {
  beforeAll(async () => {
    await setup({})
    const ctx = useTestContext()
    baseURL = ctx.url as string
  })

  // ✅ define helper *after* setup
  async function loginAndGetCookie(email: string, password: string): Promise<string> {
    // Use full URL to ensure correct resolution
    await $fetch(`${baseURL}/api/auth/signup`, {
      method: 'POST',
      body: { email, password, name: 'E2E Tester' },
    })

    const res = await fetch(`${baseURL}/api/auth/login`, {
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

    // Create quest
    const questRes = await $fetch<{ quest: { id: string } }>(`${baseURL}/api/quests`, {
      method: 'POST',
      headers: { cookie },
      body: { title: 'Quest Title', description: 'Testing PATCH' },
    })

    const questId = questRes.quest.id

    // Create task
    const taskRes = await $fetch<{ task: { id: string } }>(`${baseURL}/api/tasks`, {
      method: 'POST',
      headers: { cookie },
      body: { questId, title: 'Initial Task', status: 'draft' },
    })

    const taskId = taskRes.task.id

    // Patch task
    const updatedTask = await $fetch<{ task: { id: string, status: string } }>(
      `${baseURL}/api/tasks/${taskId}`,
      {
        method: 'PATCH',
        headers: { cookie },
        body: { status: 'completed' },
      },
    )

    expect(updatedTask.task.status).toBe('completed')
  })

  it('blocks non-owners from updating a task', async () => {
    const ownerEmail = `owner-${Date.now()}@example.com`
    const ownerPass = 'password123'
    const ownerCookie = await loginAndGetCookie(ownerEmail, ownerPass)

    const questRes = await $fetch<{ quest: { id: string } }>(`${baseURL}/api/quests`, {
      method: 'POST',
      headers: { cookie: ownerCookie },
      body: { title: 'Quest Title', description: 'Testing Permissions' },
    })

    const questId = questRes.quest.id

    const taskRes = await $fetch<{ task: { id: string } }>(`${baseURL}/api/tasks`, {
      method: 'POST',
      headers: { cookie: ownerCookie },
      body: { questId, title: 'Owner Task', status: 'draft' },
    })

    const taskId = taskRes.task.id

    const attackerEmail = `attacker-${Date.now()}@example.com`
    const attackerPass = 'password123'
    const attackerCookie = await loginAndGetCookie(attackerEmail, attackerPass)

    await expect(
      $fetch(`${baseURL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { cookie: attackerCookie },
        body: { status: 'completed' },
      }),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
})
