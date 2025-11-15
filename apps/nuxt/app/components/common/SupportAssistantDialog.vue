<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { SupportAssistantTab } from '~/stores/support'
import { useSupportStore } from '~/stores/support'

const props = defineProps<{
  modelValue: boolean
  activeTab: SupportAssistantTab
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'update:activeTab', value: SupportAssistantTab): void
}>()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const selectedTab = computed({
  get: () => props.activeTab,
  set: (value: SupportAssistantTab) => emit('update:activeTab', value),
})

const supportStore = useSupportStore()
const { conversation } = storeToRefs(supportStore)
const route = useRoute()

const chatPrompt = computed(() => {
  const path = route.fullPath || route.path || '/'
  return `Need help with ${path === '/' ? 'this page' : `“${path}”`} ? Ask the assistant below.`
})

const issueForm = reactive({
  title: '',
  category: 'Bug' as 'Bug' | 'Feature Request' | 'Question',
  description: '',
})

const submitting = ref(false)
const submissionMessage = ref('')
const submissionState = ref<'idle' | 'success' | 'error'>('idle')
const submittedIssue = ref<{ number: number, url: string } | null>(null)

const canSubmitIssue = computed(() => issueForm.title.trim().length > 0 && issueForm.category.length > 0)

let suppressFeedbackReset = false

watch(dialogModel, (isOpen) => {
  if (!isOpen) {
    clearIssueForm()
    resetIssueFeedback()
  }
})

watch(() => [issueForm.title, issueForm.category, issueForm.description], () => {
  if (suppressFeedbackReset) {
    suppressFeedbackReset = false
    return
  }
  if (submissionState.value !== 'idle') {
    resetIssueFeedback()
  }
})

function resetIssueFeedback() {
  submissionState.value = 'idle'
  submissionMessage.value = ''
  submittedIssue.value = null
}

function clearIssueForm() {
  suppressFeedbackReset = true
  issueForm.title = ''
  issueForm.category = 'Bug'
  issueForm.description = ''
}

async function handleSubmitIssue() {
  if (submitting.value) {
    return
  }

  submitting.value = true
  resetIssueFeedback()

  try {
    const response = await $fetch<{
      success: boolean
      issue: { number: number, url: string }
    }>('/api/support/issues', {
      method: 'POST',
      body: {
        ...issueForm,
        route: route.fullPath || route.path || '/',
      },
    })

    if (response.success) {
      submissionState.value = 'success'
      submissionMessage.value = 'Issue submitted successfully.'
      submittedIssue.value = response.issue
      clearIssueForm()
    }
    else {
      submissionState.value = 'error'
      submissionMessage.value = 'Unable to submit issue.'
    }
  }
  catch (error) {
    submissionState.value = 'error'
    const fetchError = error as {
      data?: { statusText?: string, statusMessage?: string, message?: string }
      statusMessage?: string
      message?: string
    }
    submissionMessage.value = fetchError?.data?.statusText
      ?? fetchError?.data?.statusMessage
      ?? fetchError?.data?.message
      ?? fetchError?.statusMessage
      ?? fetchError?.message
      ?? 'Unable to submit issue.'
  }
  finally {
    submitting.value = false
  }
}

function closeDialog() {
  dialogModel.value = false
}
</script>

<template>
  <v-dialog
    v-model="dialogModel"
    :scrim="false"
    max-width="480"
    transition="dialog-bottom-transition"
    content-class="support-assistant-dialog__content"
  >
    <v-card class="support-assistant-dialog">
      <v-toolbar
        flat
        class="support-assistant-dialog__toolbar"
      >
        <v-toolbar-title class="support-assistant-dialog__title">
          Need help?
        </v-toolbar-title>
        <v-btn
          icon
          variant="text"
          color="secondary"
          aria-label="Close support assistant"
          @click="closeDialog"
        >
          <v-icon icon="mdi-close" />
        </v-btn>
      </v-toolbar>

      <v-tabs
        v-model="selectedTab"
        class="support-assistant-dialog__tabs"
        color="primary"
        align-tabs="center"
        density="compact"
      >
        <v-tab
          value="chat"
          prepend-icon="mdi-robot-happy-outline"
        >
          AI Assistant
        </v-tab>
        <v-tab
          value="issue"
          prepend-icon="mdi-github"
        >
          Report Issue
        </v-tab>
      </v-tabs>

      <v-window
        v-model="selectedTab"
        class="support-assistant-dialog__window"
      >
        <v-window-item value="chat">
          <section class="support-assistant-dialog__section">
            <v-alert
              type="info"
              variant="tonal"
              class="support-assistant-dialog__alert"
            >
              This AI assistant provides general guidance and may not reflect official support responses.
            </v-alert>
            <p class="support-assistant-dialog__lead">
              {{ chatPrompt }}
            </p>
            <div
              v-if="conversation.messages.length === 0"
              class="support-assistant-dialog__empty"
            >
              <v-icon
                icon="mdi-message-processing-outline"
                size="38"
                class="support-assistant-dialog__empty-icon"
              />
              <p>
                Start a conversation to get step-by-step help tailored to this page.
              </p>
            </div>
            <v-textarea
              class="support-assistant-dialog__input"
              label="Ask a question"
              rows="3"
              auto-grow
              placeholder="How do I create a quest?"
            />
            <v-btn
              color="primary"
              block
              class="support-assistant-dialog__action"
              :disabled="true"
            >
              Coming soon
            </v-btn>
          </section>
        </v-window-item>

        <v-window-item value="issue">
          <section class="support-assistant-dialog__section">
            <v-form
              class="support-assistant-dialog__form"
              @submit.prevent="handleSubmitIssue"
            >
              <p class="support-assistant-dialog__lead">
                Submit a GitHub issue without leaving the app. We pre-fill context based on your current page.
              </p>
              <v-text-field
                v-model="issueForm.title"
                class="support-assistant-dialog__field"
                label="Issue title"
                placeholder="Something isn’t working"
                required
              />
              <v-select
                v-model="issueForm.category"
                class="support-assistant-dialog__field"
                label="Category"
                :items="['Bug', 'Feature Request', 'Question']"
              />
              <v-textarea
                v-model="issueForm.description"
                class="support-assistant-dialog__field"
                label="Description"
                rows="4"
                auto-grow
                placeholder="Describe the problem, steps to reproduce, or idea."
              />
              <v-alert
                v-if="submissionState !== 'idle'"
                :type="submissionState === 'success' ? 'success' : 'error'"
                variant="tonal"
                class="support-assistant-dialog__alert"
              >
                <p class="support-assistant-dialog__alert-message">
                  {{ submissionMessage }}
                </p>
                <v-btn
                  v-if="submissionState === 'success' && submittedIssue"
                  class="support-assistant-dialog__alert-link"
                  variant="text"
                  color="primary"
                  size="small"
                  :href="submittedIssue.url"
                  target="_blank"
                  rel="noopener"
                >
                  View issue #{{ submittedIssue.number }}
                </v-btn>
              </v-alert>
              <v-btn
                type="submit"
                color="primary"
                block
                class="support-assistant-dialog__action"
                :loading="submitting"
                :disabled="!canSubmitIssue || submitting"
              >
                Submit to GitHub
              </v-btn>
            </v-form>
          </section>
        </v-window-item>
      </v-window>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.support-assistant-dialog__content {
  align-items: flex-end;
}

.support-assistant-dialog {
  display: flex;
  flex-direction: column;
  max-height: min(90vh, 640px);
}

.support-assistant-dialog__toolbar {
  padding-inline: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.support-assistant-dialog__title {
  font-weight: 600;
}

.support-assistant-dialog__tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.support-assistant-dialog__window {
  flex: 1;
  overflow: auto;
}

.support-assistant-dialog__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.support-assistant-dialog__alert {
  margin: 0;
}

.support-assistant-dialog__alert-message {
  margin: 0;
}

.support-assistant-dialog__alert-link {
  padding: 0;
  min-height: auto;
}

.support-assistant-dialog__lead {
  margin: 0;
  color: rgba(0, 0, 0, 0.74);
}

.support-assistant-dialog__empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
  padding: 24px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
}

.support-assistant-dialog__empty-icon {
  color: rgba(0, 0, 0, 0.38);
}

.support-assistant-dialog__input {
  margin: 0;
}

.support-assistant-dialog__action {
  margin-top: 4px;
}

.support-assistant-dialog__field {
  margin: 0;
}

.support-assistant-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 600px) {
  .support-assistant-dialog__section {
    padding: 16px;
  }
}
</style>
