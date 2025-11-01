import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import questsOwnerMiddleware from '~/middleware/quests-owner'

const hasQuestsRef = ref(false)
const loadedRef = ref(false)
const loggedInRef = ref(true)
const fetchQuestsMock = vi.fn()
const fetchSessionMock = vi.fn()
const showSnackbarMock = vi.fn()

vi.mock('~/stores/quest', () => ({
  __esModule: true,
  useQuestStore: () => ({
    fetchQuests: fetchQuestsMock,
    hasQuests: hasQuestsRef,
    loaded: loadedRef,
  }),
}))

vi.mock('~/stores/user', () => ({
  __esModule: true,
  useUserStore: () => ({
    fetchSession: fetchSessionMock,
    loggedIn: loggedInRef,
  }),
}))

vi.mock('~/composables/useSnackbar', () => ({
  __esModule: true,
  useSnackbar: () => ({ showSnackbar: showSnackbarMock }),
}))

const createTo = (path: string) => ({ path } as Parameters<typeof questsOwnerMiddleware>[0])
const createFrom = (path: string) => ({ path } as Parameters<typeof questsOwnerMiddleware>[1])

describe('quests owner middleware', () => {
  beforeEach(() => {
    hasQuestsRef.value = false
    loadedRef.value = false
    loggedInRef.value = true
    fetchQuestsMock.mockReset()
    fetchSessionMock.mockReset()
    showSnackbarMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('allows navigation when quests already exist', async () => {
    hasQuestsRef.value = true
    loadedRef.value = true

    await questsOwnerMiddleware(createTo('/quests'), createFrom('/'))

    expect(fetchQuestsMock).not.toHaveBeenCalled()
    expect(showSnackbarMock).not.toHaveBeenCalled()
  })

  it('fetches quests before checking ownership when data is not loaded', async () => {
    fetchQuestsMock.mockImplementation(async () => {
      hasQuestsRef.value = true
      loadedRef.value = true
      return [] as never
    })

    await questsOwnerMiddleware(createTo('/quests'), createFrom('/'))

    expect(fetchQuestsMock).toHaveBeenCalledWith(expect.objectContaining({ force: true }))
    expect(showSnackbarMock).not.toHaveBeenCalled()
  })

  it('redirects to quest creation when no quests are available after fetch', async () => {
    fetchQuestsMock.mockImplementation(async () => {
      loadedRef.value = true
      hasQuestsRef.value = false
      return [] as never
    })

    await questsOwnerMiddleware(createTo('/quests'), createFrom('/'))

    expect(fetchQuestsMock).toHaveBeenCalledWith(expect.objectContaining({ force: true }))
    expect(showSnackbarMock).toHaveBeenCalledWith('You need to create your first quest!', { variant: 'info' })
  })
})
