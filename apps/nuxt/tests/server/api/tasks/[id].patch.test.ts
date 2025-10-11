import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

/**
 * Utility to sign up and log in a user, returning a cookie jar
 */
async function loginAndGetCookie(email: string, password: string) {
  // Step 1: sign up
  await $fetch('/api/auth/signup', {
    method: 'POST',
    body: { email, password, name: 'E2E Tester' },
  })

  // Step 2: login — and capture the cookie header
  await $fetch.raw('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  // Extract cookie from the response
  const cookie = (await loginAndGetCookie(email, password)) ?? ''
  expect(cookie).toBeTruthy()

  return cookie
}

describe('Tasks/[ID] PATCH API', async () => {
  // Ensure Nuxt server is running
  await setup({})

  it('allows the quest owner to update their task', async () => {
    const email = `owner-${Date.now()}@example.com`
    const password = 'password123'
    const cookie = await loginAndGetCookie(email, password)

    // Create a quest while authenticated
    const questRes: { quest: { id: string } } = await $fetch('/api/quests', {
      method: 'POST',
      headers: { cookie },
      body: {
        title: 'Quest Title',
        description: 'Quest for testing PATCH',
      },
    })

    const questId = questRes.quest.id

    // Create a task under this quest
    const taskRes: { task: { id: string } } = await $fetch('/api/tasks', {
      method: 'POST',
      headers: { cookie },
      body: {
        title: 'Test Task',
        questId,
      },
    })

    const taskId = taskRes.task.id

    // Update the task’s status
    const updatedTask: { status: string } = await $fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { cookie },
      body: { status: 'completed' },
    })

    expect(updatedTask.status).toBe('completed')
  })

  it('blocks non-owners from updating a task', async () => {
    // Owner A
    const ownerEmail = `owner-${Date.now()}@example.com`
    const ownerPassword = 'password123'
    const ownerCookie = await loginAndGetCookie(ownerEmail, ownerPassword)

    const questRes: { quest: { id: string } } = await $fetch('/api/quests', {
      method: 'POST',
      headers: { cookie: ownerCookie },
      body: {
        title: 'Private Quest',
        description: 'Should not be editable by others',
      },
    })

    const questId = questRes.quest.id

    const taskRes: { task: { id: string } } = await $fetch('/api/tasks', {
      method: 'POST',
      headers: { cookie: ownerCookie },
      body: { title: 'Owner Task', questId },
    })

    const taskId = taskRes.task.id

    // Another user tries to patch the task
    const intruderCookie = await loginAndGetCookie(
      `intruder-${Date.now()}@example.com`,
      'password123',
    )

    await expect(() =>
      $fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { cookie: intruderCookie },
        body: { status: 'completed' },
      }),
    ).rejects.toThrowError(/403|unauthorized|forbidden/i)
  })
})
