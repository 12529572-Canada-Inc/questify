import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineAsyncComponent } from 'vue'
import { flushPromises, type DOMWrapper } from '@vue/test-utils'

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

    // 🧩 Build a map of fields by their visible label text
    // (Vuetify renders labels as <label>Title</label>)
    const fields: {
      title?: DOMWrapper<Element>
      description?: DOMWrapper<Element>
      goal?: DOMWrapper<Element>
      context?: DOMWrapper<Element>
      constraints?: DOMWrapper<Element>
    } = {}
    page.findAll('.v-input').forEach((inputWrapper) => {
      const label = inputWrapper.text().trim()
      const input = inputWrapper.find('.v-field__input')
      if (label.includes('Title')) fields.title = input
      else if (label.includes('Description')) fields.description = input
      else if (label.includes('outcome')) fields.goal = input
      else if (label.includes('background')) fields.context = input
      else if (label.includes('Constraints')) fields.constraints = input
    })

    // 🧠 Sanity check
    expect(Object.keys(fields)).toEqual(
      expect.arrayContaining(['title', 'description', 'goal', 'context', 'constraints']),
    )

    // 🧠 Fill the fields
    await fields.title?.setValue('New Quest')
    await fields.description?.setValue('Embark on a journey')
    await fields.goal?.setValue('Win')
    await fields.context?.setValue('Context details')
    await fields.constraints?.setValue('Constraints info')

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

    const fields: {
      title?: DOMWrapper<Element>
      description?: DOMWrapper<Element>
    } = {}
    page.findAll('.v-input').forEach((inputWrapper) => {
      const label = inputWrapper.text().trim()
      const input = inputWrapper.find('.v-field__input')
      if (label.includes('Title')) fields.title = input
      else if (label.includes('Description')) fields.description = input
    })

    await fields.title?.setValue('Bad Quest')
    await fields.description?.setValue('Fails to save')

    await page.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(page.html()).toContain('Server failure')
  })
})
