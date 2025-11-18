import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import Dashboard from '../../../app/pages/dashboard.vue'

vi.mock('~/composables/useMetrics', () => ({
  useMetrics: async () => ({
    data: { value: {
      totalQuests: 10,
      activeQuests: 4,
      completedQuests: 6,
      publicQuests: 3,
      privateQuests: 7,
      totalTasks: 42,
      completedTasks: 30,
      completionRate: 30 / 42,
      lastActiveAt: new Date().toISOString(),
    } },
    pending: { value: false },
    error: { value: null },
    refresh: vi.fn(),
  }),
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({ user: ref({ name: 'Tester' }) }),
}))

describe('Dashboard Page Metric Links', () => {
  it('renders metric links for quests and tasks', async () => {
    const AsyncWrapper = {
      components: { Dashboard },
      template: '<Suspense><Dashboard /></Suspense>',
    }
    const wrapper = mount(AsyncWrapper, {
      global: {
        stubs: ['v-container', 'v-card', 'v-card-text', 'v-card-title', 'v-row', 'v-col', 'v-icon', 'v-btn', 'v-avatar', 'v-divider', 'v-progress-circular', 'v-alert', 'v-skeleton-loader', 'NuxtLink'],
      },
    })
    await flushPromises()
    await nextTick()

    const html = wrapper.html()
    expect(html).toContain('Total Quests')
    expect(html).toContain('Active Quests')
    expect(html).toContain('Completed Quests')
    expect(html).toContain('Total Tasks')
    expect(html).toContain('Completed Tasks')
  })
})
