import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineAsyncComponent, ref } from 'vue'

const useQuestsMock = vi.fn()

vi.mock('~/composables/useQuest', () => ({
  useQuests: useQuestsMock,
}))

describe('Quests index page', () => {
  beforeEach(() => {
    useQuestsMock.mockReset()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('renders quests returned from the composable', async () => {
    useQuestsMock.mockResolvedValue({
      data: ref([
        {
          id: 'quest-1',
          title: 'Quest One',
          description: 'First quest description',
          goal: 'Finish the journey',
        },
      ]),
    })

    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/quests/index.vue')),
    )

    expect(useQuestsMock).toHaveBeenCalled()
    const html = page.html()
    expect(html).toContain('Quest One')
    expect(html).toContain('First quest description')
    expect(html).toContain('Finish the journey')
  })

  it('always shows actions to create a quest', async () => {
    useQuestsMock.mockResolvedValue({
      data: ref([]),
    })

    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/quests/index.vue')),
    )

    const html = page.html()
    expect(html).toContain('Create Quest')
    expect(html).toContain('fab')
  })
})
