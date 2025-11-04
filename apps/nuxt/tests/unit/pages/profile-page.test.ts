import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import ProfilePage from '../../../app/pages/profile.vue'
import { mountWithBase } from '../support/mount-options'
import { useProfileStore } from '~/stores/profile'
import { useUserStore } from '~/stores/user'
import { useUiStore } from '~/stores/ui'

const consumeFlashMock = vi.fn()
const showSnackbarMock = vi.fn()
const openInPopupMock = vi.fn()
const routerReplaceMock = vi.fn()
const routerPushMock = vi.fn()

const originalUseRuntimeConfig = (globalThis as typeof globalThis & { useRuntimeConfig?: () => unknown }).useRuntimeConfig

vi.mock('~/composables/useOAuthFlash', () => ({
  useOAuthFlash: () => ({
    consumeOAuthFlash: consumeFlashMock,
  }),
}))

vi.mock('~/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: showSnackbarMock,
  }),
}))

const mockProfile = {
  id: 'user-1',
  email: 'person@example.com',
  name: 'Test User',
  avatarUrl: '',
  themePreference: 'light' as const,
  roles: [],
  privileges: [],
  providers: ['google'],
}

beforeEach(() => {
  setActivePinia(createPinia())
  consumeFlashMock.mockReset()
  showSnackbarMock.mockReset()
  openInPopupMock.mockReset()
  routerReplaceMock.mockReset()
  routerPushMock.mockReset()

  Reflect.set(globalThis, 'useRuntimeConfig', vi.fn(() => ({
    public: { features: { aiAssist: true } },
  })))

  vi.stubGlobal('useRoute', () => ({
    query: {},
  }))

  vi.stubGlobal('useRouter', () => ({
    replace: routerReplaceMock,
    push: routerPushMock,
  }))

  vi.stubGlobal('useUserSession', () => ({
    user: ref({ id: 'user-1' }),
    loggedIn: ref(true),
    fetch: vi.fn(),
    clear: vi.fn(),
    openInPopup: openInPopupMock,
  }))

  const userStore = useUserStore()
  userStore.setUser({
    id: mockProfile.id,
    email: mockProfile.email,
    name: mockProfile.name,
    providers: mockProfile.providers,
  })

  const profileStore = useProfileStore()
  profileStore.profile = mockProfile
  profileStore.status = 'idle'
  profileStore.saving = false

  const uiStore = useUiStore()
  uiStore.setThemePreference('light')
})

afterEach(() => {
  if (originalUseRuntimeConfig) {
    Reflect.set(globalThis, 'useRuntimeConfig', originalUseRuntimeConfig)
  }
  else {
    Reflect.deleteProperty(globalThis, 'useRuntimeConfig')
  }
  vi.unstubAllGlobals()
})

describe('ProfilePage', () => {
  it('renders provider cards and triggers OAuth linking', async () => {
    const wrapper = mountWithBase(ProfilePage, {
      global: {
        stubs: vuetifyStubs,
      },
    })

    const facebookButton = wrapper.get('[data-testid="profile-provider-btn-facebook"] button, [data-testid="profile-provider-btn-facebook"]')
    await facebookButton.trigger('click')
    expect(openInPopupMock).toHaveBeenCalledWith('/api/auth/facebook?origin=profile')
  })

  it('submits updated profile fields', async () => {
    const profileStore = useProfileStore()
    const updatedProfile = { ...mockProfile, name: 'Updated User' }
    const updateSpy = vi.spyOn(profileStore, 'updateProfile').mockResolvedValue(updatedProfile)

    const wrapper = mountWithBase(ProfilePage, {
      global: {
        stubs: vuetifyStubs,
      },
    })

    const nameInputWrapper = wrapper.get('[data-testid="profile-name-input"] input')
    await nameInputWrapper.setValue('Updated User')

    const saveBtn = wrapper.get('[data-testid="profile-save-button"] button, [data-testid="profile-save-button"]')
    await saveBtn.trigger('click')

    expect(updateSpy).toHaveBeenCalledWith({ name: 'Updated User' })
  })
})

const vuetifyStubs = {
  VContainer: { template: '<div><slot /></div>' },
  VRow: { template: '<div><slot /></div>' },
  VCol: { template: '<div><slot /></div>' },
  VCard: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VCardSubtitle: { template: '<div><slot /></div>' },
  VList: { template: '<div><slot /></div>' },
  VListItem: {
    inheritAttrs: false,
    template: '<div v-bind="$attrs"><slot name="prepend" /><slot /><slot name="append" /></div>',
  },
  VListItemTitle: { template: '<div><slot /></div>' },
  VAvatar: { template: '<div class="avatar"><slot /></div>' },
  VIcon: { template: '<span class="icon"><slot /></span>' },
  VChip: { template: '<span class="chip"><slot /></span>' },
  VBtn: {
    inheritAttrs: false,
    emits: ['click'],
    template: '<button type="button" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  },
  VSwitch: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<label class="switch" v-bind="$attrs"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" /></label>',
  },
  VAlert: { template: '<div class="alert"><slot /></div>' },
  VRadioGroup: { template: '<div><slot /></div>' },
  VRadio: { template: '<div><slot /></div>' },
  VTextField: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue', 'blur', 'click:append-inner'],
    template: `
      <div v-bind="$attrs">
        <input
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          @blur="$emit('blur', $event)"
        />
      </div>
    `,
  },
  VForm: {
    emits: ['submit'],
    template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>',
  },
  VDivider: { template: '<hr />' },
  VImg: { template: '<img />' },
  VChipGroup: { template: '<div><slot /></div>' },
}
