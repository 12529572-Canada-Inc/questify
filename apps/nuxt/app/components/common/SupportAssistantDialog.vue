<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { SupportAssistantTab } from '~/stores/support'
import { useSupportStore } from '~/stores/support'
import { useUiStore } from '~/stores/ui'
import { useSnackbar } from '~/composables/useSnackbar'
import { resolveApiError } from '~/utils/error'
import type { SupportAssistantResponse } from '~/types/support'

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
const uiStore = useUiStore()
const { aiAssistEnabled } = storeToRefs(uiStore)
const { conversation } = storeToRefs(supportStore)
const { showSnackbar } = useSnackbar()
const route = useRoute()

const chatPrompt = computed(() => {
  const path = route.fullPath || route.path || '/'
  return `Need help with ${path === '/' ? 'this page' : `"${path}"`}? Ask the assistant below.`
})

const chatInput = ref('')
const chatError = ref('')
const sending = ref(false)
const chatContainer = ref<HTMLElement | null>(null)

const hasChatHistory = computed(() => conversation.value.messages.length > 0)
const chatDisabledReason = computed(() => {
  if (!uiStore.aiAssistFeatureEnabled) {
    return 'AI assistant is disabled for this environment.'
  }
  if (!aiAssistEnabled.value) {
    return 'AI assistant is turned off in your preferences.'
  }
  return ''
})
const canSendQuestion = computed(() => chatInput.value.trim().length > 0 && !sending.value && !chatDisabledReason.value)

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
    chatError.value = ''
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

watch(chatInput, () => {
  chatError.value = ''
})

watch(() => conversation.value.messages.length, async () => {
  await nextTick()
  const container = chatContainer.value
  if (container) {
    container.scrollTop = container.scrollHeight
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

function resetConversation() {
  supportStore.resetConversation()
  chatError.value = ''
}

async function sendQuestion() {
  if (!canSendQuestion.value) {
    return
  }

  const question = chatInput.value.trim()
  chatInput.value = ''
  chatError.value = ''
  const routePath = route.fullPath || route.path || '/'

  supportStore.appendMessage({
    role: 'user',
    content: question,
    route: routePath,
  })

  sending.value = true

  try {
    const response = await $fetch<SupportAssistantResponse>('/api/support/assistant', {
      method: 'POST',
      body: {
        question,
        route: routePath,
        conversation: conversation.value.messages,
        htmlSnapshot: buildHtmlSnapshot(),
        visibleText: buildVisibleText(),
      },
    })

    supportStore.appendMessage({
      id: response.messageId,
      createdAt: response.createdAt,
      role: 'assistant',
      content: response.answer,
      route: routePath,
    })
  }
  catch (error) {
    const message = resolveApiError(error, 'Unable to reach the AI assistant right now.')
    chatError.value = message
    showSnackbar(message, { variant: 'error' })
  }
  finally {
    sending.value = false
  }
}

function closeDialog() {
  dialogModel.value = false
}

function buildHtmlSnapshot(): string | undefined {
  if (import.meta.server) {
    return undefined
  }
  const doc = globalThis.document
  if (!doc?.documentElement?.outerHTML) {
    return undefined
  }

  // Sanitize by removing all <script> elements using DOM APIs
  const wrapper = doc.createElement('div');
  wrapper.innerHTML = doc.documentElement.outerHTML;
  // Remove all script elements from the wrapper
  const scripts = wrapper.querySelectorAll('script');
  scripts.forEach((el) => el.remove());
  const sanitizedHtml = wrapper.innerHTML;
  const collapsed = sanitizedHtml.replace(/\s+/g, ' ').trim();
  return collapsed.slice(0, 100_000);
}

function buildVisibleText(): string | undefined {
  if (import.meta.server) {
    return undefined
  }
  const bodyText = globalThis.document?.body?.innerText
  if (!bodyText) {
    return undefined
  }
  const normalized = bodyText.replace(/\s+/g, ' ').trim()
  return normalized ? normalized.slice(0, 10_000) : undefined
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
            <v-alert
              v-if="chatDisabledReason"
              type="warning"
              variant="tonal"
              border="start"
              class="support-assistant-dialog__alert"
            >
              {{ chatDisabledReason }}
            </v-alert>
            <div
              class="support-assistant-dialog__chat"
            >
              <div
                v-if="!hasChatHistory"
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
              <div
                v-else
                ref="chatContainer"
                class="support-assistant-dialog__conversation"
              >
                <v-slide-y-transition group>
                  <div
                    v-for="message in conversation.messages"
                    :key="message.id"
                    class="support-assistant-dialog__message"
                    :class="`support-assistant-dialog__message--${message.role}`"
                  >
                    <div class="support-assistant-dialog__message-meta">
                      {{ message.role === 'assistant' ? 'Assistant' : 'You' }}
                    </div>
                    <div class="support-assistant-dialog__message-text">
                      {{ message.content }}
                    </div>
                  </div>
                </v-slide-y-transition>
                <div
                  v-if="sending"
                  class="support-assistant-dialog__message support-assistant-dialog__message--assistant support-assistant-dialog__message--pending"
                >
                  <div class="support-assistant-dialog__message-meta">
                    Assistant
                  </div>
                  <div class="support-assistant-dialog__pending">
                    <v-progress-circular
                      color="primary"
                      indeterminate
                      size="20"
                      width="3"
                    />
                    <span>Thinking&hellip;</span>
                  </div>
                </div>
              </div>

              <div class="support-assistant-dialog__form">
                <v-alert
                  v-if="chatError"
                  type="warning"
                  variant="tonal"
                  border="start"
                  class="support-assistant-dialog__alert"
                >
                  {{ chatError }}
                </v-alert>
                <v-textarea
                  v-model="chatInput"
                  class="support-assistant-dialog__input"
                  label="Ask a question"
                  rows="3"
                  auto-grow
                  placeholder="How do I create a quest?"
                  :disabled="sending || Boolean(chatDisabledReason)"
                />
                <div class="support-assistant-dialog__actions-row">
                  <v-btn
                    color="primary"
                    block
                    class="support-assistant-dialog__action"
                    :loading="sending"
                    :disabled="!canSendQuestion"
                    @click="sendQuestion"
                  >
                    Send message
                  </v-btn>
                  <v-btn
                    v-if="hasChatHistory"
                    variant="text"
                    color="secondary"
                    class="support-assistant-dialog__reset"
                    :disabled="sending"
                    @click="resetConversation"
                  >
                    Reset conversation
                  </v-btn>
                </div>
              </div>
            </div>
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

.support-assistant-dialog__chat {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.support-assistant-dialog__conversation {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  max-height: 260px;
  overflow: auto;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
}

.support-assistant-dialog__message {
  max-width: 90%;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
}

.support-assistant-dialog__message--assistant {
  align-self: flex-start;
}

.support-assistant-dialog__message--user {
  align-self: flex-end;
  background: rgba(76, 110, 245, 0.1);
}

.support-assistant-dialog__message-meta {
  margin-bottom: 4px;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
}

.support-assistant-dialog__message-text {
  margin: 0;
  white-space: pre-wrap;
}

.support-assistant-dialog__message--pending {
  background: rgba(0, 0, 0, 0.03);
}

.support-assistant-dialog__pending {
  display: flex;
  align-items: center;
  gap: 10px;
}

.support-assistant-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.support-assistant-dialog__actions-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.support-assistant-dialog__reset {
  align-self: center;
  min-height: auto;
  padding: 0;
}

.support-assistant-dialog__action {
  margin-top: 4px;
}

.support-assistant-dialog__field {
  margin: 0;
}

@media (max-width: 600px) {
  .support-assistant-dialog__section {
    padding: 16px;
  }
}
</style>
