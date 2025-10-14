<script setup lang="ts">
import type { Segment } from '~/utils/text-with-links'
import { splitTextIntoSegments } from '~/utils/text-with-links'

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

const segments = computed<Segment[]>(() => splitTextIntoSegments(props.text))

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
