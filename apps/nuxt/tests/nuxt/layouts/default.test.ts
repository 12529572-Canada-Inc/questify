import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import DefaultLayout from '~/layouts/default.vue'

const buttonStub = {
  props: ['to'],
  emits: ['click'],
  template: '<button :data-to="to" @click="$emit(\'click\')"><slot /></button>',
}

function mountLayout() {
  return mount(DefaultLayout, {
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        VMain: { template: '<main><slot /></main>' },
        VAppBar: { template: '<header><slot /></header>' },
        VAppBarTitle: { template: '<div><slot /></div>' },
        VImg: { template: '<img />' },
        VSpacer: { template: '<span />' },
        VBtn: buttonStub,
      },
    },
  })
}

// TODO: Enable these tests once the layout logic is finalized
describe.skip('default layout', () => {
  const push = vi.fn()
  const clear = vi.fn()
  const fetchMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    push.mockReset()
    clear.mockReset()
    fetchMock.mockReset()
    vi.stubGlobal('useRouter', () => ({ push }))
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows login links when the user is logged out', () => {
    vi.stubGlobal('useUserSession', () => ({
      clear,
      loggedIn: ref(false),
    }))

    const wrapper = mountLayout()

    expect(wrapper.text()).toContain('Login')
    expect(wrapper.text()).toContain('Signup')
    expect(wrapper.text()).not.toContain('Logout')
  })

  it('shows a logout action when the user is logged in', () => {
    vi.stubGlobal('useUserSession', () => ({
      clear,
      loggedIn: ref(true),
    }))

    const wrapper = mountLayout()
    expect(wrapper.text()).toContain('Logout')
  })

  it('logs out via the API and redirects to the login page', async () => {
    vi.stubGlobal('useUserSession', () => ({
      clear,
      loggedIn: ref(true),
    }))

    const wrapper = mountLayout()
    const logoutButton = wrapper.findAll('button').find(button => button.text().trim() === 'Logout')

    expect(logoutButton).toBeDefined()
    await logoutButton!.trigger('click')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(clear).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/auth/login')
  })
})
