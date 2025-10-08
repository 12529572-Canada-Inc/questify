import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TextWithLinks from '~/components/TextWithLinks.vue'

const sampleText = 'Check the docs at https://nuxt.com and follow updates on https://www.example.com/news'

describe('TextWithLinks component', () => {
  it('renders links with summarized hostnames', async () => {
    const wrapper = await mountSuspended(TextWithLinks, {
      props: {
        text: sampleText,
      },
    })

    const anchors = wrapper.findAll('a')
    expect(anchors).toHaveLength(2)
    expect(anchors[0]?.attributes('href')).toBe('https://nuxt.com')
    expect(anchors[0]?.text()).toBe('nuxt.com')
    expect(anchors[1]?.attributes('href')).toBe('https://www.example.com/news')
    expect(anchors[1]?.text()).toBe('example.com')
  })

  it('falls back to the provided message when no text is supplied', async () => {
    const wrapper = await mountSuspended(TextWithLinks, {
      props: {
        fallback: 'Nothing to show',
      },
    })

    expect(wrapper.text()).toContain('Nothing to show')
    expect(wrapper.findAll('a')).toHaveLength(0)
  })
})
