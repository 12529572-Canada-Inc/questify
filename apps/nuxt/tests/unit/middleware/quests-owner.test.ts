import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigateToMock = vi.fn()
const fetchQuests = vi.fn()
const fetchSession = vi.fn()
const showSnackbar = vi.fn()

const resetRefs = () => ({
  hasQuests: { value: false },
  loaded: { value: false },
  loggedIn: { value: false },
})

let refs = resetRefs()

vi.stubGlobal('navigateTo', navigateToMock)

vi.doMock('pinia', () => ({
  storeToRefs: (store: { refs: Record<string, { value: unknown }> }) => store.refs,
}))

vi.doMock('~/stores/quest', () => ({
  useQuestStore: () => ({
    refs: {
      get hasQuests() { return refs.hasQuests },
      get loaded() { return refs.loaded },
    },
    fetchQuests,
  }),
}))

vi.doMock('~/stores/user', () => ({
  useUserStore: () => ({
    refs: {
      get loggedIn() { return refs.loggedIn },
    },
    fetchSession,
  }),
}))

vi.doMock('~/composables/useSnackbar', () => ({
  useSnackbar: () => ({ showSnackbar }),
}))

describe('middleware/quests-owner', () => {
  beforeEach(() => {
    vi.resetModules()
    refs = resetRefs()
    navigateToMock.mockReset()
    fetchQuests.mockReset()
    fetchSession.mockReset()
    fetchSession.mockResolvedValue(null)
    showSnackbar.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches session when the user is not logged in', async () => {
    const middleware = (await import('../../../app/middleware/quests-owner')).default

    await middleware({} as never, {} as never)

    expect(fetchSession).toHaveBeenCalled()
  })

  it('redirects to quest creation when no quests are available after fetch', async () => {
    refs.loggedIn.value = true
    fetchQuests.mockImplementation(async () => {
      refs.loaded.value = true
      refs.hasQuests.value = false
    })

    const middleware = (await import('../../../app/middleware/quests-owner')).default
    await middleware({} as never, {} as never)

    expect(fetchQuests).toHaveBeenCalledTimes(1)
    expect(showSnackbar).toHaveBeenCalledWith('You need to create your first quest!', { variant: 'info' })
    expect(navigateToMock).toHaveBeenCalledWith('/quests/new', { replace: true })
  })

  it('does nothing when quests are already loaded and present', async () => {
    refs.loggedIn.value = true
    refs.loaded.value = true
    refs.hasQuests.value = true

    const middleware = (await import('../../../app/middleware/quests-owner')).default
    await middleware({} as never, {} as never)

    expect(fetchQuests).not.toHaveBeenCalled()
    expect(showSnackbar).not.toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
