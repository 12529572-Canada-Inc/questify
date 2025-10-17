<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '~/utils/markdown'

const props = withDefaults(defineProps<{
  content?: string | null
  emptyMessage?: string
}>(), {
  content: '',
  emptyMessage: '',
})

const rendered = computed(() => renderMarkdown(props.content))
</script>

<!-- eslint-disable vue/no-v-html -->
<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div
    v-if="rendered"
    class="markdown-block"
    v-html="rendered"
  />
  <p
    v-else-if="emptyMessage"
    class="text-body-2 text-medium-emphasis mb-0"
  >
    {{ emptyMessage }}
  </p>
</template>
<!-- eslint-enable vue/no-v-html -->

<style scoped>
.markdown-block {
  display: block;
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.markdown-block :deep(p) {
  margin: 0 0 0.75rem;
}

.markdown-block :deep(ul),
.markdown-block :deep(ol) {
  padding-left: 1.25rem;
  margin: 0.75rem 0;
}

.markdown-block :deep(li + li) {
  margin-top: 0.35rem;
}

.markdown-block :deep(blockquote) {
  border-left: 3px solid rgba(var(--v-theme-on-surface), 0.2);
  margin: 0.75rem 0;
  padding: 0.5rem 1rem;
  font-style: italic;
}

.markdown-block :deep(code) {
  font-family: var(--v-font-family-mono, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace);
  background: rgba(var(--v-theme-surface-variant), 0.6);
  padding: 2px 4px;
  border-radius: 4px;
}

.markdown-block :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}
</style>
