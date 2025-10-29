import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import SettingsPage from '../../../app/pages/settings.vue'
import { mountWithBase } from '../support/mount-options'
import { useUserStore } from '~/stores/user'

const consumeFlashMock = vi.fn()
const fetchSessionMock = vi.fn().mockResolvedValue(undefined)
const openInPopupMock = vi.fn()

vi.mock('~/composables/useOAuthFlash', () => ({
  useOAuthFlash: () => ({
    consumeOAuthFlash: consumeFlashMock,
  }),
}))

vi.mock('~/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: vi.fn(),
  }),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    consumeFlashMock.mockReset()
    fetchSessionMock.mockReset()
    openInPopupMock.mockReset()

    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useRoute', () => ({
      query: {},
    }))
    vi.stubGlobal('useUserSession', () => ({
      user: ref({ id: 'user-1' }),
      loggedIn: ref(true),
      fetch: fetchSessionMock,
      clear: vi.fn(),
      openInPopup: openInPopupMock,
    }))

    const userStore = useUserStore()
    userStore.setUser({
      id: 'user-1',
      email: 'person@example.com',
      name: 'Test User',
      providers: ['google'],
    })
    vi.spyOn(userStore, 'fetchSession').mockResolvedValue(userStore.user)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders provider cards and triggers linking', async () => {
    const wrapper = mountWithBase(SettingsPage, {
      global: {
        stubs: {
          VContainer: { template: '<div><slot /></div>' },
          VRow: { template: '<div><slot /></div>' },
          VCol: { template: '<div><slot /></div>' },
          VCard: { template: '<div><slot /></div>' },
          VCardTitle: { template: '<div><slot /></div>' },
          VCardSubtitle: { template: '<div><slot /></div>' },
          VList: { template: '<div><slot /></div>' },
          VListItem: {
            template: '<div class="list-item"><slot name="prepend" /><slot /><slot name="append" /></div>',
          },
          VListItemTitle: { template: '<div><slot /></div>' },
          VListItemSubtitle: { template: '<div><slot /></div>' },
          VAvatar: { template: '<div class="avatar"><slot /></div>' },
          VIcon: { template: '<span><slot /></span>' },
          VChip: { template: '<span class="chip"><slot /></span>' },
          VBtn: { props: ['loading'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
        },
      },
    })

    expect(wrapper.text()).toContain('Account Connections')
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)

    // Click the Facebook button (should initiate linking)
    const facebookButton = buttons.find(btn => btn.text().includes('Connect') || btn.text().includes('Reconnect'))
    expect(facebookButton).toBeDefined()
    await facebookButton!.trigger('click')
    expect(openInPopupMock).toHaveBeenCalled()
  })
})
