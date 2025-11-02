<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { SUPPORTED_OAUTH_PROVIDERS, type OAuthProvider } from 'shared'
import { useOAuthFlash } from '~/composables/useOAuthFlash'
import { useSnackbar } from '~/composables/useSnackbar'
import { useUserStore } from '~/stores/user'
import { useUiStore } from '~/stores/ui'

definePageMeta({
  middleware: ['auth'],
})

const userStore = useUserStore()
const uiStore = useUiStore()
const route = useRoute()
const session = useUserSession()
const { showSnackbar } = useSnackbar()
const { consumeOAuthFlash } = useOAuthFlash()

const linking = ref<OAuthProvider | null>(null)

const { providers } = storeToRefs(userStore)
const { aiAssistEnabled } = storeToRefs(uiStore)

const aiAssistFeatureEnabled = uiStore.aiAssistFeatureEnabled
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

onMounted(async () => {
  await userStore.fetchSession().catch(() => null)

  const flash = consumeOAuthFlash()
  if (flash) {
    const label = providerCatalog[flash.provider]?.label ?? flash.provider
    if (flash.action === 'linked') {
      showSnackbar(`${label} account linked successfully.`, { variant: 'success' })
    }
    else if (flash.action === 'created') {
      showSnackbar(`Signed up with ${label}.`, { variant: 'success' })
    }
    else {
      showSnackbar(`Signed in with ${label}.`, { variant: 'success' })
    }
  }
})

if (import.meta.client) {
  watch(providers, () => {
    if (linking.value && providers.value.includes(linking.value)) {
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
  }, { deep: false })

  watch(() => route.query.oauthError, (value) => {
    if (typeof value !== 'string') {
      return
    }

    const label = providerCatalog[value as OAuthProvider]?.label ?? value
    showSnackbar(`We couldn’t connect your ${label} account. Please try again.`, { variant: 'error' })
  }, { immediate: true })
}

function isLinked(provider: OAuthProvider) {
  return providers.value.includes(provider)
}

function buttonLabel(provider: OAuthProvider) {
  return isLinked(provider) ? 'Reconnect' : 'Connect'
}

function buttonVariant(provider: OAuthProvider) {
  return isLinked(provider) ? 'tonal' : 'elevated'
}

function startLink(provider: OAuthProvider) {
  linking.value = provider
  try {
    session.openInPopup(`/api/auth/${provider}?origin=settings`)
  }
  finally {
    setTimeout(() => {
      if (linking.value === provider) {
        linking.value = null
      }
    }, 700)
  }
}
</script>

<template>
  <v-container class="settings-page py-12">
    <v-row justify="center">
      <v-col
        cols="12"
        md="8"
        lg="6"
      >
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
              class="settings-provider-item"
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
                  @click="startLink(provider)"
                >
                  {{ buttonLabel(provider) }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card class="pa-6 mt-6">
          <v-card-title class="text-h5 mb-2">
            Quest AI Assistance
          </v-card-title>
          <v-card-subtitle class="mb-4">
            Control whether the “Improve with AI” helpers appear while creating quests.
          </v-card-subtitle>

          <v-row
            align="center"
            class="settings-ai-toggle"
          >
            <v-col cols="8">
              <p class="text-body-2 mb-2">
                When enabled, Questify can suggest better titles, goals, context, and constraints using your selected AI model.
              </p>
              <p class="text-body-2 text-medium-emphasis mb-0">
                Suggestions never overwrite your text until you accept them.
              </p>
            </v-col>
            <v-col
              cols="4"
              class="text-right"
            >
              <v-switch
                v-model="aiAssistPreference"
                color="primary"
                inset
                :disabled="!aiAssistFeatureEnabled"
                aria-label="Toggle quest AI assistance"
              />
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
  </v-container>
</template>

<style scoped>
.settings-provider-item + .settings-provider-item {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.settings-ai-toggle {
  gap: 12px;
}
</style>
