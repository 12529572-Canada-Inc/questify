import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Dashboard from '../../../app/pages/dashboard.vue'
import { ref } from 'vue'

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

    // 3 quest metrics + 3 task metrics = 6 clickable metrics
    const metricLinks = wrapper.findAll('.dashboard__metric')
    expect(metricLinks.length).toBe(6)

    // Basic href assertions (only NuxtLink anchors have href)
    const hrefs = wrapper.findAll('a.dashboard__metric').map(l => l.attributes('href')).sort()
    expect(hrefs).toContain('/quests')
    expect(hrefs).toContain('/quests/active')
    expect(hrefs).toContain('/quests/completed')
    expect(hrefs).toContain('/tasks')
    expect(hrefs).toContain('/tasks/completed')
  })
})
