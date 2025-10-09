// TODO: Fix these tests
import { describe } from 'vitest'
// import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
// import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// let useFetchMock: ReturnType<typeof vi.fn>
// let restoreUseFetch: () => void

// --- Setup before all tests ---
// beforeAll(() => {
//   // mockNuxtImport must run after mocks are declared
//   restoreUseFetch = mockNuxtImport('useFetch', () => (...args: unknown[]) => useFetchMock(...args))
// })

describe.skip('useQuest composables', () => {
  // beforeEach(() => {
  //   useFetchMock = vi.fn()
  // })

  // afterEach(() => {
  //   vi.resetModules()
  //   vi.clearAllMocks()
  // })

  // it('requests a specific quest with a stable key', async () => {
  //   const expected = { data: 'quest-data' }
  //   useFetchMock.mockReturnValue(expected)

  //   const { useQuest } = await import('~/composables/useQuest')

  //   const result = useQuest('123')

  //   expect(useFetchMock).toHaveBeenCalledWith('/api/quests/123', { key: 'quest-123' })
  //   expect(result).toBe(expected)
  // })

  // it('requests the list of quests', async () => {
  //   const expected = { data: 'quests-data' }
  //   useFetchMock.mockReturnValue(expected)

  //   const { useQuests } = await import('~/composables/useQuest')

  //   const result = useQuests()

  //   expect(useFetchMock).toHaveBeenCalledWith('/api/quests')
  //   expect(result).toBe(expected)
  // })
})

// --- Cleanup after all tests ---
// afterAll(() => {
//   restoreUseFetch?.()
//   vi.unstubAllGlobals()
// })
