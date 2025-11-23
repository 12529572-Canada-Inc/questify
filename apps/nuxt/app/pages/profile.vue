<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect, onMounted } from 'vue'
import { SUPPORTED_OAUTH_PROVIDERS, type OAuthProvider, type ThemePreference } from 'shared'
import { useOAuthFlash } from '~/composables/useOAuthFlash'
import { useSnackbar } from '~/composables/useSnackbar'
import { useProfileStore } from '~/stores/profile'
import { useUserStore } from '~/stores/user'
import { useUiStore } from '~/stores/ui'

definePageMeta({
  middleware: ['auth'],
})

const profileStore = useProfileStore()
const userStore = useUserStore()
const uiStore = useUiStore()

const route = useRoute()
const router = useRouter()
const session = useUserSession()
const { showSnackbar } = useSnackbar()
const { consumeOAuthFlash } = useOAuthFlash()

// Create refs directly from store properties to avoid SSR issues with storeToRefs
const profile = computed(() => profileStore.profile)
const status = computed(() => profileStore.status)
const saving = computed(() => profileStore.saving)
const aiAssistEnabled = computed(() => uiStore?.aiAssistEnabled ?? false)
const aiAssistFeatureEnabled = computed(() => uiStore?.aiAssistFeatureEnabled ?? false)
const uiThemePreference = computed(() => uiStore?.themePreference ?? 'light')
const linkedProviders = computed(() => userStore.providers ?? [])
const sessionAvatar = computed(() => userStore.avatarUrl)

const loading = computed(() => status.value === 'loading' && !profile.value)
const loadError = computed(() => status.value === 'error' && !profile.value)

const form = reactive({
  name: '',
  email: '',
  avatarUrl: '',
  themePreference: 'light' as ThemePreference,
})

const remoteAvatarUrl = ref('')
const formErrors = reactive<{ name?: string, email?: string, avatarUrl?: string }>({})
const linking = ref<OAuthProvider | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarIsUpload = computed(() => form.avatarUrl.startsWith('data:image/'))
const avatarPreview = computed(() => form.avatarUrl || sessionAvatar.value || '')

const themeOptions: Array<{ value: ThemePreference, label: string, description: string, icon: string }> = [
  {
    value: 'light',
    label: 'Light',
    description: 'Always use the light theme.',
    icon: 'mdi-weather-sunny',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Always use the dark theme.',
    icon: 'mdi-weather-night',
  },
  {
    value: 'auto',
    label: 'Auto',
    description: 'Switch between light and dark based on local time (7pm – 7am).',
    icon: 'mdi-theme-light-dark',
  },
]

function resetForm() {
  if (!profile.value) {
    return
  }

  form.name = profile.value.name ?? ''
  form.email = profile.value.email
  form.avatarUrl = profile.value.avatarUrl ?? ''
  form.themePreference = profile.value.themePreference ?? uiThemePreference.value ?? 'light'
  remoteAvatarUrl.value = isRemoteAvatar(form.avatarUrl) ? form.avatarUrl : ''
  clearErrors()
}

const normalisedProfile = computed(() => {
  if (!profile.value) {
    return null
  }
  return {
    name: (profile.value.name ?? '').trim(),
    email: profile.value.email?.trim?.() ?? '',
    avatarUrl: profile.value.avatarUrl ?? '',
    themePreference: profile.value.themePreference,
  }
})

const normalisedForm = computed(() => ({
  name: form.name.trim(),
  email: form.email.trim(),
  avatarUrl: form.avatarUrl.trim(),
  themePreference: form.themePreference,
}))

const isDirty = computed(() => {
  if (!normalisedProfile.value) {
    return false
  }

  return (
    normalisedProfile.value.name !== normalisedForm.value.name
    || normalisedProfile.value.email !== normalisedForm.value.email
    || normalisedProfile.value.avatarUrl !== normalisedForm.value.avatarUrl
    || normalisedProfile.value.themePreference !== normalisedForm.value.themePreference
  )
})

const aiAssistPreference = computed({
  get: () => aiAssistEnabled.value,
  set: (value: boolean) => {
    uiStore.setAiAssistEnabled(Boolean(value))
    showSnackbar(value ? 'AI assistance enabled.' : 'AI assistance turned off.', { variant: 'success' })
  },
})

const providerCatalog: Record<OAuthProvider, { label: string, icon: string }> = {
  google: {
    label: 'Google',
    icon: 'mdi-google',
  },
  facebook: {
    label: 'Facebook',
    icon: 'mdi-facebook',
  },
}

function isLinked(provider: OAuthProvider) {
  return linkedProviders.value.includes(provider)
}

function buttonLabel(provider: OAuthProvider) {
  return isLinked(provider) ? 'Reconnect' : 'Connect'
}

function buttonVariant(provider: OAuthProvider) {
  return isLinked(provider) ? 'tonal' : 'elevated'
}

function clearErrors() {
  formErrors.name = undefined
  formErrors.email = undefined
  formErrors.avatarUrl = undefined
}

function validateForm() {
  clearErrors()

  const { name, email, avatarUrl } = normalisedForm.value

  if (name.length > 120) {
    formErrors.name = 'Display name must be 120 characters or fewer.'
  }

  if (!email || !isValidEmail(email)) {
    formErrors.email = 'Enter a valid email address.'
  }

  if (avatarUrl) {
    if (!isValidAvatar(avatarUrl)) {
      formErrors.avatarUrl = 'Avatars must be HTTPS URLs or image data URIs under 1MB.'
    }
  }

  return !formErrors.name && !formErrors.email && !formErrors.avatarUrl
}

async function saveProfile() {
  if (!profile.value) {
    return
  }

  if (!validateForm() || !isDirty.value) {
    return
  }

  const current = normalisedProfile.value
  const next = normalisedForm.value

  if (!current) {
    return
  }

  const payload: {
    name?: string | null
    email?: string
    avatarUrl?: string | null
    themePreference?: ThemePreference
  } = {}

  if (current.name !== next.name) {
    payload.name = next.name || null
  }
  if (current.email !== next.email) {
    payload.email = next.email
  }
  if (current.avatarUrl !== next.avatarUrl) {
    payload.avatarUrl = next.avatarUrl || null
  }
  if (current.themePreference !== next.themePreference) {
    payload.themePreference = next.themePreference
  }

  try {
    await profileStore.updateProfile(payload)
    showSnackbar('Profile updated successfully.', { variant: 'success' })
    resetForm()
  }
  catch (err: unknown) {
    const message = resolveProfileErrorMessage(err)
    showSnackbar(message, { variant: 'error' })
  }
}

function resolveProfileErrorMessage(error: unknown) {
  const status = (error as { status?: number })?.status || (error as { statusCode?: number })?.statusCode

  if (status === 409) {
    formErrors.email = 'That email address is already in use.'
    return 'That email address is already in use.'
  }

  return 'We couldn’t save your profile. Please try again.'
}

function triggerAvatarSelect() {
  avatarInput.value?.click()
}

async function onAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement | null
  if (!input) {
    return
  }

  const file = input.files?.[0]
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    formErrors.avatarUrl = 'Please choose an image file.'
    showSnackbar('Please choose an image file.', { variant: 'error' })
    input.value = ''
    return
  }

  if (file.size > MAX_AVATAR_BYTES) {
    formErrors.avatarUrl = 'Images must be smaller than 1MB.'
    showSnackbar('Images must be smaller than 1MB.', { variant: 'error' })
    input.value = ''
    return
  }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    form.avatarUrl = dataUrl
    remoteAvatarUrl.value = ''
    formErrors.avatarUrl = undefined
  }
  catch {
    formErrors.avatarUrl = 'We could not read that image. Please try another file.'
    showSnackbar('We could not read that image. Please try another file.', { variant: 'error' })
  }
  finally {
    input.value = ''
  }
}

function applyRemoteAvatar() {
  if (!remoteAvatarUrl.value) {
    form.avatarUrl = ''
    formErrors.avatarUrl = undefined
    return
  }

  if (!isValidAvatar(remoteAvatarUrl.value)) {
    formErrors.avatarUrl = 'Enter a valid HTTPS image URL.'
    return
  }

  form.avatarUrl = remoteAvatarUrl.value.trim()
  formErrors.avatarUrl = undefined
}

function removeAvatar() {
  form.avatarUrl = ''
  remoteAvatarUrl.value = ''
  formErrors.avatarUrl = undefined
}

function isRemoteAvatar(value: string) {
  return value.startsWith('http')
}

function startLink(provider: OAuthProvider) {
  linking.value = provider
  try {
    session.openInPopup(`/api/auth/${provider}?origin=profile`)
  }
  finally {
    setTimeout(() => {
      if (linking.value === provider) {
        linking.value = null
      }
    }, 700)
  }
}

async function handleProvidersUpdated() {
  if (linking.value && linkedProviders.value.includes(linking.value)) {
    linking.value = null
  }
  const flash = consumeOAuthFlash()
  if (!flash) {
    return
  }
  const label = providerCatalog[flash.provider]?.label ?? flash.provider
  if (flash.action === 'linked') {
    showSnackbar(`${label} account linked successfully.`, { variant: 'success' })
  }
  else {
    showSnackbar(`Signed in with ${label}.`, { variant: 'success' })
  }
}

function handleOAuthError(value: unknown) {
  if (typeof value !== 'string') {
    return
  }
  const label = providerCatalog[value as OAuthProvider]?.label ?? value
  showSnackbar(`We couldn’t connect your ${label} account. Please try again.`, { variant: 'error' })
}

watch(() => linkedProviders.value.slice(), handleProvidersUpdated)
watch(() => route.query.oauthError, handleOAuthError, { immediate: true })

watch(profile, (value) => {
  if (value) {
    resetForm()
  }
}, { immediate: true })

// Sync form theme changes to UI store immediately for real-time preview
watch(() => form.themePreference, (newTheme) => {
  if (newTheme && newTheme !== uiThemePreference.value) {
    uiStore.setThemePreference(newTheme)
  }
})

watchEffect(() => {
  if (uiThemePreference.value && form.themePreference !== uiThemePreference.value && !isDirty.value) {
    form.themePreference = uiThemePreference.value
  }
})

onMounted(async () => {
  if (!profile.value) {
    await profileStore.fetchProfile().catch(() => null)
  }

  const flash = consumeOAuthFlash()
  if (flash) {
    const label = providerCatalog[flash.provider]?.label ?? flash.provider
    if (flash.action === 'linked') {
      showSnackbar(`${label} account linked successfully.`, { variant: 'success' })
    }
    else if (flash.action === 'created') {
      showSnackbar(`${label} account signed up.`, { variant: 'success' })
    }
    else {
      showSnackbar(`Signed in with ${label}.`, { variant: 'success' })
    }
  }

  if (route.query.oauthError) {
    handleOAuthError(route.query.oauthError)
    const query = { ...route.query }
    delete query.oauthError
    await router.replace({ query })
  }
})

const MAX_AVATAR_BYTES = 1024 * 1024

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidAvatar(value: string) {
  if (value.startsWith('data:image/')) {
    return value.length <= MAX_AVATAR_BYTES * 1.37 // rough base64 expansion allowance
  }

  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  }
  catch {
    return false
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      if (result) {
        resolve(result)
      }
      else {
        reject(new Error('read-error'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
</script>

<template>
  <v-container class="profile-page py-12">
    <v-row justify="center">
      <v-col
        cols="12"
        md="10"
        lg="9"
      >
        <v-alert
          v-if="loadError"
          type="error"
          variant="tonal"
          border="start"
          class="mb-6"
        >
          We couldn’t load your profile right now. Please refresh the page to try again.
        </v-alert>

        <v-skeleton-loader
          v-if="loading"
          type="card-avatar, list-item, actions"
          class="mb-6"
        />

        <v-form
          v-else
          class="profile-form"
          @submit.prevent="saveProfile"
        >
          <v-card class="pa-6 mb-6">
            <v-card-title class="text-h5 mb-2">
              Profile
            </v-card-title>
            <v-card-subtitle class="mb-6">
              Update your Questify identity, contact information, and avatar.
            </v-card-subtitle>

            <input
              ref="avatarInput"
              type="file"
              class="d-none"
              accept="image/*"
              @change="onAvatarSelected"
            >

            <v-row
              class="profile-details"
              align="stretch"
              no-gutters
            >
              <v-col
                cols="12"
                md="4"
                class="pr-md-4 mb-4 mb-md-0"
              >
                <div class="avatar-preview d-flex flex-column align-center">
                  <v-avatar
                    size="108"
                    class="mb-4"
                  >
                    <template v-if="avatarPreview">
                      <v-img
                        :src="avatarPreview"
                        alt="Profile avatar preview"
                        cover
                      />
                    </template>
                    <template v-else>
                      <v-icon
                        icon="mdi-account-circle"
                        size="104"
                        color="primary"
                      />
                    </template>
                  </v-avatar>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    class="mb-2"
                    @click="triggerAvatarSelect"
                  >
                    Upload Image
                  </v-btn>
                  <v-btn
                    variant="text"
                    density="comfortable"
                    @click="removeAvatar"
                  >
                    Remove Avatar
                  </v-btn>
                  <p class="text-caption text-medium-emphasis text-center mt-2">
                    Supports JPG, PNG, or GIF under 1MB. Uploaded images are stored securely with your account.
                  </p>
                </div>
              </v-col>
              <v-col
                cols="12"
                md="8"
              >
                <v-text-field
                  v-model="form.name"
                  label="Display Name"
                  maxlength="120"
                  :error-messages="formErrors.name"
                  autocomplete="name"
                  data-testid="profile-name-input"
                />
                <v-text-field
                  v-model="form.email"
                  label="Email Address"
                  type="email"
                  required
                  :error-messages="formErrors.email"
                  autocomplete="email"
                  data-testid="profile-email-input"
                />
                <v-text-field
                  v-model="remoteAvatarUrl"
                  label="Avatar URL"
                  placeholder="https://example.com/avatar.png"
                  :error-messages="formErrors.avatarUrl"
                  prepend-inner-icon="mdi-link-variant"
                  append-inner-icon="mdi-check"
                  data-testid="profile-avatar-url-input"
                  @click:append-inner="applyRemoteAvatar"
                  @keydown.enter.prevent="applyRemoteAvatar"
                  @blur="applyRemoteAvatar"
                />
                <p
                  v-if="avatarIsUpload"
                  class="text-caption text-medium-emphasis mt-1"
                >
                  You have an uploaded avatar stored with your account.
                </p>
              </v-col>
            </v-row>

            <v-divider class="my-6" />

            <div class="profile-actions d-flex flex-wrap gap-3">
              <v-btn
                color="primary"
                type="submit"
                :disabled="!isDirty || saving"
                :loading="saving"
                data-testid="profile-save-button"
              >
                Save Changes
              </v-btn>
              <v-btn
                variant="text"
                :disabled="!isDirty || saving"
                @click="resetForm"
              >
                Discard Changes
              </v-btn>
            </div>
          </v-card>

          <v-row>
            <v-col
              cols="12"
              md="6"
              class="mb-6"
            >
              <v-card class="pa-6 h-100">
                <v-card-title class="text-h5 mb-2">
                  Theme
                </v-card-title>
                <v-card-subtitle class="mb-4">
                  Choose how Questify looks across devices.
                </v-card-subtitle>

                <v-radio-group v-model="form.themePreference">
                  <v-radio
                    v-for="option in themeOptions"
                    :key="option.value"
                    :value="option.value"
                    class="mb-3"
                  >
                    <template #label>
                      <div class="theme-option">
                        <v-icon
                          :icon="option.icon"
                          class="mr-3"
                        />
                        <div>
                          <div class="text-subtitle-1">
                            {{ option.label }}
                          </div>
                          <div class="text-body-2 text-medium-emphasis">
                            {{ option.description }}
                          </div>
                        </div>
                      </div>
                    </template>
                  </v-radio>
                </v-radio-group>
              </v-card>
            </v-col>

            <v-col
              cols="12"
              md="6"
              class="mb-6"
            >
              <v-card class="pa-6 h-100">
                <v-card-title class="text-h5 mb-2">
                  Quest AI Assistance
                </v-card-title>
                <v-card-subtitle class="mb-4 text-wrap">
                  Control whether the “Improve with AI” helpers appear while creating quests.
                </v-card-subtitle>

                <v-row
                  align="start"
                  class="profile-ai-toggle"
                >
                  <v-col
                    cols="3"
                    class="d-flex justify-end align-start"
                  >
                    <v-switch
                      v-model="aiAssistPreference"
                      color="primary"
                      inset
                      :disabled="!aiAssistFeatureEnabled"
                      aria-label="Toggle quest AI assistance"
                    />
                  </v-col>
                  <v-col cols="9">
                    <p class="text-body-2 mb-0">
                      When enabled, Questify can suggest better titles, goals, context, and constraints using your selected AI model.
                    </p>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Suggestions never overwrite your text until you accept them.
                    </p>
                  </v-col>
                </v-row>

                <v-alert
                  v-if="!aiAssistFeatureEnabled"
                  type="info"
                  variant="tonal"
                  border="start"
                  class="mt-4"
                >
                  AI assistance has been disabled by your administrator or environment settings.
                </v-alert>
              </v-card>
            </v-col>
          </v-row>
        </v-form>

        <v-card class="pa-6">
          <v-card-title class="text-h5 mb-2">
            Account Connections
          </v-card-title>
          <v-card-subtitle class="mb-6">
            Link your Questify account with social providers.
          </v-card-subtitle>

          <v-list density="comfortable">
            <v-list-item
              v-for="provider in SUPPORTED_OAUTH_PROVIDERS"
              :key="provider"
              class="profile-provider-item"
            >
              <template #prepend>
                <v-avatar
                  color="primary"
                  variant="tonal"
                >
                  <v-icon :icon="providerCatalog[provider].icon" />
                </v-avatar>
              </template>
              <v-list-item-title class="text-subtitle-1 font-weight-medium">
                {{ providerCatalog[provider].label }}
              </v-list-item-title>
              <template #append>
                <v-chip
                  v-if="isLinked(provider)"
                  class="mr-3"
                  color="success"
                  variant="tonal"
                  density="comfortable"
                >
                  Connected
                </v-chip>
                <v-btn
                  color="primary"
                  :variant="buttonVariant(provider)"
                  :loading="linking === provider"
                  :data-testid="`profile-provider-btn-${provider}`"
                  @click="startLink(provider)"
                >
                  {{ buttonLabel(provider) }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.profile-details {
  gap: 16px 0;
}

.avatar-preview p {
  max-width: 240px;
}

.profile-actions {
  justify-content: flex-start;
}

.profile-ai-toggle {
  gap: 12px;
}

.profile-provider-item + .profile-provider-item {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.theme-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

@media (max-width: 960px) {
  .profile-actions {
    justify-content: center;
  }
}
</style>
