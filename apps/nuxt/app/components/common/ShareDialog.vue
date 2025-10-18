<script setup lang="ts">
import { useClipboard, useVModel } from '@vueuse/core'

const props = defineProps<{
  modelValue: boolean
  title: string
  shareUrl: string
  description?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dialogOpen = useVModel(props, 'modelValue', emit)
const copyError = ref(false)
const showCopyTooltip = ref(false)
let copyTooltipTimer: ReturnType<typeof setTimeout> | null = null

const { copy, copied, isSupported } = useClipboard({
  source: computed(() => props.shareUrl),
})

async function copyLink() {
  copyError.value = false

  if (!isSupported.value) {
    copyError.value = true
    return
  }

  try {
    await copy()
  }
  catch (err) {
    console.error('Failed to copy link', err)
    copyError.value = true
    hideCopiedTooltip()
  }
}

function hideCopiedTooltip() {
  if (copyTooltipTimer) {
    clearTimeout(copyTooltipTimer)
    copyTooltipTimer = null
  }
  showCopyTooltip.value = false
}

function showCopiedTooltip() {
  hideCopiedTooltip()
  showCopyTooltip.value = true
  copyTooltipTimer = setTimeout(() => {
    showCopyTooltip.value = false
    copyTooltipTimer = null
  }, 2000)
}

watch(copied, (value) => {
  if (value) {
    copyError.value = false
    showCopiedTooltip()
  }
})

watch(dialogOpen, (open) => {
  if (!open) {
    copyError.value = false
    hideCopiedTooltip()
  }
})

onBeforeUnmount(() => {
  hideCopiedTooltip()
})
</script>

<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="520"
    :aria-label="title"
  >
    <v-card>
      <v-card-title class="text-h6 font-weight-medium">
        {{ title }}
      </v-card-title>
      <v-card-text class="d-flex flex-column gap-4">
        <p
          v-if="description"
          class="text-body-2 text-medium-emphasis mb-3"
        >
          {{ description }}
        </p>

        <div class="d-flex flex-column gap-2 mb-4">
          <div class="share-dialog__link-row">
            <v-text-field
              :model-value="shareUrl"
              label="Shareable link"
              variant="outlined"
              hide-details="auto"
              class="flex-grow-1"
              readonly
              @focus="$event.target?.select?.()"
            />
            <v-tooltip
              v-model="showCopyTooltip"
              text="Link Copied!"
              location="bottom"
            >
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon
                  variant="tonal"
                  color="primary"
                  aria-label="Copy share link"
                  @click="copyLink"
                >
                  <v-icon icon="mdi-content-copy" />
                </v-btn>
              </template>
            </v-tooltip>
          </div>
          <v-alert
            v-if="copyError"
            type="error"
            variant="tonal"
            density="compact"
            text="Unable to copy link. You can copy it manually."
          />
        </div>

        <ClientOnly>
          <div class="d-flex flex-column align-center gap-2">
            <QrCodeDisplay
              :value="shareUrl"
              :alt="`${title} QR code`"
            />
            <span class="text-caption text-medium-emphasis text-center">
              Scan to open this link on a mobile device.
            </span>
          </div>
          <template #fallback>
            <div class="d-flex justify-center py-6">
              <v-progress-circular
                indeterminate
                color="primary"
              />
            </div>
          </template>
        </ClientOnly>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="dialogOpen = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.share-dialog__link-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
</style>
