import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { defineAsyncComponent, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

// --- Define mocks first ---
const useQuestMock = vi.fn()
const refreshMock = vi.fn()
const useRouteMock = vi.fn()
const intervalPauseMock = vi.fn()
const intervalResumeMock = vi.fn()
const useIntervalFnMock = vi.fn(() => ({ pause: intervalPauseMock, resume: intervalResumeMock }))

// --- External composable mocks ---
vi.mock('~/composables/useQuest', () => ({
  useQuest: useQuestMock,
}))

vi.mock('@vueuse/core', () => ({
  useIntervalFn: useIntervalFnMock,
}))

let restoreUseRoute: () => void

// --- Setup before all tests ---
beforeAll(() => {
  // mockNuxtImport must run after mocks are declared
  restoreUseRoute = mockNuxtImport('useRoute', () => useRouteMock)
})

describe('Quests detail page', () => {
  beforeEach(() => {
    useQuestMock.mockReset()
    refreshMock.mockReset()
    useRouteMock.mockReset()
    intervalPauseMock.mockReset()
    intervalResumeMock.mockReset()
    useIntervalFnMock.mockClear()

    useRouteMock.mockReturnValue({ params: { id: 'quest-123' } })

    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('renders quest information and tasks when data is present', async () => {
    useQuestMock.mockResolvedValue({
      data: ref({
        id: 'quest-123',
        title: 'Heroic Deeds',
        description: 'Save the realm',
        status: 'in_progress',
        goal: 'Become a legend',
        context: 'Urgent matters',
        constraints: 'No time to waste',
        owner: { name: 'Aria' },
        tasks: [
          { id: 'task-1', title: 'Gather allies', status: 'pending', details: 'Recruit support' },
        ],
      }),
      refresh: refreshMock,
      pending: ref(false),
    })

    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/quests/[id].vue')),
    )
    await flushPromises()

    const html = page.html()
    expect(useQuestMock).toHaveBeenCalledWith('quest-123')
    expect(html).toContain('Heroic Deeds')
    expect(html).toContain('Save the realm')
    expect(html).toContain('Gather allies')
    expect(html).toContain('Aria')
  })

  it('marks the quest as completed when the action is triggered', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('$fetch', fetchMock)

    useQuestMock.mockResolvedValue({
      data: ref({
        id: 'quest-999',
        title: 'Final Challenge',
        description: 'Face the boss',
        status: 'in_progress',
        goal: null,
        context: null,
        constraints: null,
        owner: { name: 'Hero' },
        tasks: [],
      }),
      refresh: refreshMock,
      pending: ref(false),
    })

    useRouteMock.mockReturnValue({ params: { id: 'quest-999' } })

    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/quests/[id].vue')),
    )
    await flushPromises()

    const completeButton = page.findAll('button').find(btn => btn.text().includes('Mark as Completed'))
    expect(completeButton).toBeDefined()

    await completeButton!.trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/quests/quest-999', {
      method: 'PATCH',
      body: { status: 'completed' },
    })
    expect(refreshMock).toHaveBeenCalled()
  })

  it('shows an error alert when the quest is missing', async () => {
    useQuestMock.mockResolvedValue({
      data: ref(null),
      refresh: refreshMock,
      pending: ref(false),
    })

    const page = await mountSuspended(
      defineAsyncComponent(() => import('~/pages/quests/[id].vue')),
    )
    await flushPromises()

    expect(page.html()).toContain('Quest Not Found')
  })
})

// --- Cleanup after all tests ---
afterAll(() => {
  restoreUseRoute?.()
  vi.unstubAllGlobals()
})
