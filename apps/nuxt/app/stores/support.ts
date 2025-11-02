import { computed, ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useSessionStorage } from '@vueuse/core'

export type SupportAssistantTab = 'chat' | 'issue'

type SupportMessageRole = 'user' | 'assistant'

export type SupportMessage = {
  id: string
  role: SupportMessageRole
  content: string
  createdAt: string
  route?: string
}

type SupportConversation = {
  messages: SupportMessage[]
}

const STORAGE_KEY = 'questify-support-conversation'

function createMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `message-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
}

export const useSupportStore = defineStore('support', () => {
  const dialogOpen = ref(false)
  const activeTab = ref<SupportAssistantTab>('chat')
  const conversation = useSessionStorage<SupportConversation>(STORAGE_KEY, {
    messages: [],
  })

  const hasConversation = computed(() => conversation.value.messages.length > 0)

  function openDialog(tab?: SupportAssistantTab) {
    dialogOpen.value = true
    if (tab) {
      activeTab.value = tab
    }
  }

  function closeDialog() {
    dialogOpen.value = false
  }

  function setActiveTab(tab: SupportAssistantTab) {
    activeTab.value = tab
  }

  function appendMessage(input: Omit<SupportMessage, 'id' | 'createdAt'> & Partial<Pick<SupportMessage, 'id' | 'createdAt'>>) {
    const message: SupportMessage = {
      id: input.id ?? createMessageId(),
      role: input.role,
      content: input.content,
      route: input.route,
      createdAt: input.createdAt ?? new Date().toISOString(),
    }
    conversation.value.messages.push(message)
  }

  function resetConversation() {
    conversation.value = { messages: [] }
  }

  return {
    dialogOpen,
    activeTab,
    conversation,
    hasConversation,
    openDialog,
    closeDialog,
    setActiveTab,
    appendMessage,
    resetConversation,
  }
})

if (import.meta.hot?.accept) {
  import.meta.hot.accept(acceptHMRUpdate(useSupportStore, import.meta.hot))
}
