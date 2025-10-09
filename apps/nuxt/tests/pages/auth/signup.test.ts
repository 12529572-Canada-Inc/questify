// TODO: Fix these tests
import { describe } from 'vitest'
// import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
// import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
// import { defineAsyncComponent } from 'vue'
// import { flushPromises } from '@vue/test-utils'

// --- Define mocks first ---
// const routerPushMock = vi.fn()
// const useRouterMock = vi.fn()

// let restoreUseRouter: () => void

// --- Setup before all tests ---
// beforeAll(() => {
//   // mockNuxtImport must be run after mocks are declared
//   restoreUseRouter = mockNuxtImport('useRouter', () => useRouterMock)
// })

describe.skip('Auth signup page', () => {
  // beforeEach(() => {
  //   routerPushMock.mockReset()
  //   useRouterMock.mockReset()
  //   useRouterMock.mockReturnValue({ push: routerPushMock })

  //   const fetchMock = vi.fn().mockResolvedValue({})
  //   vi.stubGlobal('$fetch', fetchMock)
  // })

  // afterEach(() => {
  //   vi.unstubAllGlobals()
  //   vi.resetModules()
  //   vi.clearAllMocks()
  // })

  // it('shows inputs for account creation and login link', async () => {
  //   const page = await mountSuspended(
  //     defineAsyncComponent(() => import('~/pages/auth/signup.vue')),
  //   )

  //   const html = page.html()
  //   expect(html).toContain('Sign Up')
  //   expect(html).toContain('Name')
  //   expect(html).toContain('Already have an account? Log in')
  // })

  // it('submits the signup form and redirects to quests', async () => {
  //   const fetchMock = vi.fn().mockResolvedValue({})
  //   vi.stubGlobal('$fetch', fetchMock)

  //   const page = await mountSuspended(
  //     defineAsyncComponent(() => import('~/pages/auth/signup.vue')),
  //   )

  //   // Simulate valid user input
  //   page.vm.name = 'Ada Lovelace'
  //   page.vm.email = 'ada@example.com'
  //   page.vm.password = 'engines123'
  //   page.vm.valid = true

  //   await page.find('form').trigger('submit.prevent')
  //   await flushPromises()

  //   expect(fetchMock).toHaveBeenCalledWith('/api/auth/signup', {
  //     method: 'POST',
  //     body: {
  //       email: 'ada@example.com',
  //       name: 'Ada Lovelace',
  //       password: 'engines123',
  //     },
  //   })
  //   expect(useRouterMock).toHaveBeenCalled()
  //   expect(routerPushMock).toHaveBeenCalledWith('/quests')
  // })

  // it('shows the error returned from the server', async () => {
  //   const fetchMock = vi.fn().mockRejectedValue(new Error('Email already used'))
  //   vi.stubGlobal('$fetch', fetchMock)

  //   const page = await mountSuspended(
  //     defineAsyncComponent(() => import('~/pages/auth/signup.vue')),
  //   )

  //   page.vm.name = 'Existing User'
  //   page.vm.email = 'taken@example.com'
  //   page.vm.password = 'password'
  //   page.vm.valid = true

  //   await page.find('form').trigger('submit.prevent')
  //   await flushPromises()

  //   expect(page.html()).toContain('Email already used')
  // })
})

// --- Cleanup after all tests ---
// afterAll(() => {
//   restoreUseRouter?.()
//   vi.unstubAllGlobals()
// })
