import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSupportStore } from '~/stores/support'

describe('useSupportStore', () => {
  setActivePinia(createPinia())

  it('appends messages and trims history to the max', () => {
    const store = useSupportStore()
    store.resetConversation()

    for (let i = 0; i < 25; i += 1) {
      store.appendMessage({ role: 'user', content: `message-${i}` })
    }

    expect(store.conversation.messages).toHaveLength(20)
    expect(store.conversation.messages[0]?.content).toBe('message-5')
    expect(store.conversation.messages.at(-1)?.content).toBe('message-24')
  })

  it('tracks open state and active tab', () => {
    const store = useSupportStore()

    expect(store.dialogOpen).toBe(false)
    store.openDialog('issue')
    expect(store.dialogOpen).toBe(true)
    expect(store.activeTab).toBe('issue')

    store.setActiveTab('chat')
    expect(store.activeTab).toBe('chat')

    store.closeDialog()
    expect(store.dialogOpen).toBe(false)
  })
})
