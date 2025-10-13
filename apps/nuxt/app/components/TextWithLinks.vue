<script setup lang="ts">
import { computed, useAttrs } from 'vue'

interface TextSegment {
  type: 'text'
  value: string
}

interface LinkSegment {
  type: 'link'
  value: string
  display: string
}

type Segment = TextSegment | LinkSegment

const props = withDefaults(
  defineProps<{
    text?: string | null
    fallback?: string
    tag?: string
  }>(),
  {
    fallback: '',
    tag: 'span',
  },
)

const attrs = useAttrs()

const urlPattern = /https?:\/\/[^\s]+/g

function summarizeUrl(url: string) {
  try {
    const { hostname } = new URL(url)
    return hostname.replace(/^www\./, '')
  }
  catch {
    return url
  }
}

const segments = computed<Segment[]>(() => {
  if (!props.text)
    return []

  const result: Segment[] = []
  const { text } = props
  let lastIndex = 0

  for (const match of text.matchAll(urlPattern)) {
    const url = match[0]
    const index = match.index ?? 0

    if (index > lastIndex)
      result.push({ type: 'text', value: text.slice(lastIndex, index) })

    result.push({ type: 'link', value: url, display: summarizeUrl(url) })
    lastIndex = index + url.length
  }

  if (lastIndex < text.length)
    result.push({ type: 'text', value: text.slice(lastIndex) })

  return result
})

const hasContent = computed(() => segments.value.length > 0)
</script>

<template>
  <component
    :is="props.tag"
    v-bind="attrs"
    class="twl-root"
  >
    <template v-if="hasContent">
      <template
        v-for="(segment, index) in segments"
        :key="`${segment.type}-${index}-${segment.value}`"
      >
        <template v-if="segment.type === 'text'">
          {{ segment.value }}
        </template>
        <a
          v-else
          :href="segment.value"
          target="_blank"
          rel="noopener noreferrer"
          class="twl-link-btn"
        >
          {{ segment.display }}
        </a>
      </template>
    </template>
    <template v-else>
      {{ props.fallback }}
    </template>
  </component>
</template>

<style scoped>
.twl-link-btn {
    display: inline-block;
    padding: 0.35em 0.85em;
    margin: 0 0.15em;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 0.375em;
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}
.twl-link-btn:hover {
    background: #1d4ed8;
}
.twl-root {
    display: inline;
}
</style>
