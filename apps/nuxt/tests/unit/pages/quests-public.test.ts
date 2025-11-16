import { ref, h, Suspense } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { mountWithBase } from '../support/mount-options'
import PublicQuestsPage from '../../../app/pages/quests/public.vue'
import { useUserStore } from '~/stores/user'

const routerReplace = vi.fn()
const PUBLIC_FORM_ROUTE = { path: '/quests/new', query: { public: 'true' } }

function createDefaultResponse() {
  return {
    data: [],
    meta: {
      page: 1,
      pageSize: 0,
      total: 0,
      totalPages: 1,
      sort: 'newest',
      search: null,
      status: null,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }
}

const vBtnStub = {
  props: ['to'],
  template: '<button class="cta-btn" :data-to="typeof to === \'string\' ? to : JSON.stringify(to)"><slot /></button>',
}

let sessionLoggedIn: ReturnType<typeof ref<boolean>>

beforeEach(() => {
  setActivePinia(createPinia())
  routerReplace.mockReset()

  const sessionUser = ref<SessionUser | null>(null)
  sessionLoggedIn = ref(false)

  vi.stubGlobal('useUserSession', () => ({
    user: sessionUser,
    loggedIn: sessionLoggedIn,
    fetch: vi.fn(),
    clear: vi.fn(),
    openInPopup: vi.fn(),
  }))

  vi.stubGlobal('useRoute', () => ({
    query: {},
    path: '/quests/public',
  }))
  vi.stubGlobal('useRouter', () => ({
    replace: routerReplace,
  }))

  vi.stubGlobal('useAsyncData', vi.fn(async () => ({
    data: ref(createDefaultResponse()),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  })))
})

describe('quests/public page', () => {
  it('points CTA to auth with redirect when logged out', async () => {
    const wrapper = mountWithBase({
      render() {
        return h(Suspense, {}, { default: () => h(PublicQuestsPage) })
      },
    }, {
      global: {
        config: {
          compilerOptions: {
            isCustomElement: () => false,
          },
        },
        stubs: {
          'Suspense': false,
          'VBtn': vBtnStub,
          'v-btn': vBtnStub,
        },
        components: {
          'VBtn': vBtnStub,
          'v-btn': vBtnStub,
        },
      },
    })

    await flushPromises()

    const cta = wrapper.find('.cta-btn')
    expect(cta.exists()).toBe(true)
    const to = JSON.parse(cta.attributes('data-to') || '{}')
    expect(to).toEqual({ path: '/auth/login', query: { redirectTo: '/quests/new?public=true' } })
  })

  it('links CTA directly to public quest form when logged in', async () => {
    const userStore = useUserStore()
    sessionLoggedIn.value = true
    userStore.setUser({ id: 'user-1', email: 'quester@example.com' } as SessionUser)

    const wrapper = mountWithBase({
      render() {
        return h(Suspense, {}, { default: () => h(PublicQuestsPage) })
      },
    }, {
      global: {
        config: {
          compilerOptions: {
            isCustomElement: () => false,
          },
        },
        stubs: {
          'Suspense': false,
          'VBtn': vBtnStub,
          'v-btn': vBtnStub,
        },
        components: {
          'VBtn': vBtnStub,
          'v-btn': vBtnStub,
        },
      },
    })

    await flushPromises()

    const cta = wrapper.find('.cta-btn')
    const to = JSON.parse(cta.attributes('data-to') || '{}')
    expect(to).toEqual(PUBLIC_FORM_ROUTE)
  })
})
