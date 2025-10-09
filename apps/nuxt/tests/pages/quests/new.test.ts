import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineAsyncComponent } from 'vue'
import { flushPromises } from '@vue/test-utils'

const routerPushMock = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

describe('Quests new page', () => {
  beforeEach(() => {
    routerPushMock.mockReset()
    const fetchMock = vi.fn().mockResolvedValue({ success: true, quest: { id: 'quest-42' } })
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('renders fields for creating a quest', async () => {
    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/quests/new.vue')),
    )

    const html = page.html()
    expect(html).toContain('Create a New Quest')
    expect(html).toContain('Title')
    expect(html).toContain('Description')
    expect(html).toContain('Back to Quests')
  })

  it('posts the form and navigates to the created quest', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ success: true, quest: { id: 'quest-77' } })
    vi.stubGlobal('$fetch', fetchMock)

    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/quests/new.vue')),
    )

    // 🧠 Use realistic DOM interactions so v-model updates fire properly
    const titleInput = page.get('input[name="title"]')
    const descriptionInput = page.get('textarea[name="description"]')
    const goalInput = page.get('input[name="goal"]')
    const contextInput = page.get('textarea[name="context"]')
    const constraintsInput = page.get('textarea[name="constraints"]')

    await titleInput.setValue('New Quest')
    await titleInput.trigger('input')

    await descriptionInput.setValue('Embark on a journey')
    await descriptionInput.trigger('input')

    await goalInput.setValue('Win')
    await goalInput.trigger('input')

    await contextInput.setValue('Context details')
    await contextInput.trigger('input')

    await constraintsInput.setValue('Constraints info')
    await constraintsInput.trigger('input')

    // Mark form as valid if needed
    page.vm.valid = true

    await page.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/quests', {
      method: 'POST',
      body: {
        title: 'New Quest',
        description: 'Embark on a journey',
        goal: 'Win',
        context: 'Context details',
        constraints: 'Constraints info',
      },
    })
    expect(routerPushMock).toHaveBeenCalledWith('/quests/quest-77')
  })

  it('surfaces errors returned by the API', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Server failure'))
    vi.stubGlobal('$fetch', fetchMock)

    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/quests/new.vue')),
    )

    const titleInput = page.get('input[name="title"]')
    const descriptionInput = page.get('textarea[name="description"]')

    await titleInput.setValue('Bad Quest')
    await titleInput.trigger('input')

    await descriptionInput.setValue('Fails to save')
    await descriptionInput.trigger('input')

    page.vm.valid = true

    await page.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(page.html()).toContain('Server failure')
  })
})
