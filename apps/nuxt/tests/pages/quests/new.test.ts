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

    // 🧠 Vuetify renders all text inputs/areas with .v-field__input
    const inputs = page.findAll('.v-field__input')
    expect(inputs.length).toBeGreaterThanOrEqual(5)

    const [title, description, goal, context, constraints] = inputs

    await title.setValue('New Quest')
    await description.setValue('Embark on a journey')
    await goal.setValue('Win')
    await context.setValue('Context details')
    await constraints.setValue('Constraints info')

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

    const inputs = page.findAll('.v-field__input')
    const [title, description] = inputs

    await title.setValue('Bad Quest')
    await description.setValue('Fails to save')

    page.vm.valid = true

    await page.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(page.html()).toContain('Server failure')
  })
})
