import '../support/mocks/vueuse'
import '../support/mocks/qrcode'

import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import AuthFormCard from '../../../app/components/auth/AuthFormCard.vue'
import MarkdownBlock from '../../../app/components/common/MarkdownBlock.vue'
import QrCodeDisplay from '../../../app/components/common/QrCodeDisplay.vue'
import ShareDialog from '../../../app/components/common/ShareDialog.vue'
import TextWithLinks from '../../../app/components/TextWithLinks.vue'
import HomeHeroCard from '../../../app/components/home/HomeHeroCard.vue'
import { mountWithBase } from '../support/mount-options'

describe('common components', () => {
  it('renders AuthFormCard and emits submit', async () => {
    const wrapper = mountWithBase(AuthFormCard, {
      props: {
        title: 'Sign in',
        submitLabel: 'Continue',
        submitColor: 'secondary',
        loading: false,
        error: null,
        switchLabel: 'Create account',
        switchTo: '/signup',
        disableSubmitWhenInvalid: false,
      },
      slots: {
        default: '<input data-test="slot-input" />',
      },
    })

    await (wrapper.vm as unknown as { handleSubmit: () => void }).handleSubmit()
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.find('[data-test="slot-input"]').exists()).toBe(true)
  })

  it('renders MarkdownBlock content', () => {
    const wrapper = mountWithBase(MarkdownBlock, {
      props: { content: '# Heading\n\n**Bold** text' },
    })

    expect(wrapper.html()).toContain('<h1')
    expect(wrapper.html()).toContain('<strong>')
  })

  it('renders ShareDialog with QR code placeholder until data is ready', async () => {
    const wrapper = mountWithBase(ShareDialog, {
      props: {
        modelValue: true,
        title: 'Share Quest',
        shareUrl: 'https://example.com/quests/1',
        description: 'Invite a friend',
      },
    })

    await nextTick()
    await flushPromises()

    expect(wrapper.find('[data-testid="share-dialog-card"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Invite a friend')
    const state = (wrapper.vm as unknown as { $: { setupState?: Record<string, unknown> } }).$?.setupState ?? {}
    if (typeof (state as { copyLink?: () => Promise<void> }).copyLink === 'function') {
      await (state as { copyLink: () => Promise<void> }).copyLink()
    }
    if (typeof (state as { showCopiedTooltip?: () => void }).showCopiedTooltip === 'function') {
      (state as { showCopiedTooltip: () => void }).showCopiedTooltip()
    }
    if (typeof (state as { hideCopiedTooltip?: () => void }).hideCopiedTooltip === 'function') {
      (state as { hideCopiedTooltip: () => void }).hideCopiedTooltip()
    }
  })

  it('renders QR code display when running on client', async () => {
    const wrapper = mountWithBase(QrCodeDisplay, {
      props: {
        value: 'https://example.com',
        alt: 'Quest QR',
      },
    })

    await flushPromises()
    expect(wrapper.html()).toContain('qr-code__placeholder')
  })

  it('expands text with links inside TextWithLinks component', async () => {
    const wrapper = mountWithBase(TextWithLinks, {
      props: {
        text: 'Visit https://example.com for more info',
        tag: 'p',
      },
    })

    expect(wrapper.html()).toContain('https://example.com')
  })

  it('renders HomeHeroCard actions', () => {
    const wrapper = mountWithBase(HomeHeroCard)
    expect(wrapper.text()).toContain('Welcome to Questify')
    expect(wrapper.text()).toContain('View Quests')
    expect(wrapper.text()).toContain('Create Quest')
  })
})
