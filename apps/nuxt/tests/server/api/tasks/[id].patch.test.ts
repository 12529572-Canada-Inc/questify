import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Tasks/[ID] PATCH API', async () => {
  // Boot up the Nuxt test environment
  await setup({})

  it('allows the quest owner to update their task', async () => {
    // Step 1: Sign up and log in as quest owner
    const email = `owner-${Date.now()}@example.com`
    const password = 'password123'

    const signupRes = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email, password, name: 'Task Owner' },
    })
    expect(signupRes).toHaveProperty('success', true)

    const loginRes = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    expect(loginRes).toHaveProperty('user.email', email)

    // Step 2: Create a quest for this owner
    const questRes: { quest: { id: string } } = await $fetch('/api/quests', {
      method: 'POST',
      body: {
        title: 'Parent Quest',
        description: 'Quest for testing task patch',
        goal: 'Finish all tasks',
      },
    })
    expect(questRes).toHaveProperty('quest.id')
    const questId = questRes.quest.id

    // Step 3: Create a task under that quest
    const taskRes: { task: { id: string } } = await $fetch('/api/tasks', {
      method: 'POST',
      body: {
        questId,
        title: 'Initial Task',
        details: 'Initial details',
      },
    })
    expect(taskRes).toHaveProperty('task.id')
    const taskId = taskRes.task.id

    // Step 4: Patch the task as the owner
    const updated = await $fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: { status: 'completed' },
    })

    expect(updated).toHaveProperty('id', taskId)
    expect(updated).toHaveProperty('status', 'completed')
  })

  it('blocks non-owners from updating a task', async () => {
    // Step 1: Create a quest & task under one owner
    const ownerEmail = `task-owner-${Date.now()}@example.com`
    const password = 'password123'

    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email: ownerEmail, password, name: 'Owner' },
    })

    const questRes: { quest: { id: string } } = await $fetch('/api/quests', {
      method: 'POST',
      body: {
        title: 'Owner Quest',
        description: 'Quest created by owner',
        goal: 'Complete',
      },
    })
    const questId = questRes.quest.id

    const taskRes: { task: { id: string } } = await $fetch('/api/tasks', {
      method: 'POST',
      body: { questId, title: 'Owner Task', details: 'Restricted' },
    })
    const taskId = taskRes.task.id

    // Step 2: Log in as a *different* user
    const intruderEmail = `intruder-${Date.now()}@example.com`
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email: intruderEmail, password, name: 'Intruder' },
    })

    // Step 3: Attempt to patch the other user's task
    await expect(
      $fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: { status: 'completed' },
      }),
    ).rejects.toMatchObject({
      data: expect.objectContaining({ statusCode: 403 }),
    })
  })
})
