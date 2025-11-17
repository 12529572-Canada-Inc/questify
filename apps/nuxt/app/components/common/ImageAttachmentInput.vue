<script setup lang="ts">
import { computed, ref } from 'vue'

const model = defineModel<string[]>({ default: [] })

const props = withDefaults(defineProps<{
  label?: string
  hint?: string
  maxImages?: number
  maxSizeBytes?: number
  maxTotalBytes?: number
  disabled?: boolean
}>(), {
  label: 'Add images',
  hint: 'Upload or snap a photo to share more context.',
  maxImages: 3,
  maxSizeBytes: 2 * 1024 * 1024, // 2MB default ceiling
  maxTotalBytes: 4 * 1024 * 1024, // 4MB total ceiling
  disabled: false,
})

const error = ref<string | null>(null)
const busy = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const remainingSlots = computed(() => Math.max(props.maxImages - model.value.length, 0))
const isDisabled = computed(() => busy.value || props.disabled)
const existingBytes = computed(() =>
  model.value.reduce((total, image) => {
    if (image.startsWith('data:image/')) {
      const base64 = image.split(',')[1] || ''
      return total + Math.floor(base64.length * 3 / 4)
    }
    return total
  }, 0),
)

function triggerPicker() {
  if (isDisabled.value) return
  fileInput.value?.click()
}

function resetInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (target) {
    target.value = ''
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image.'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
      }
      else {
        reject(new Error('Unsupported image format.'))
      }
    }
    reader.readAsDataURL(file)
  })
}

async function handleFilesSelected(event: Event) {
  if (isDisabled.value) return
  const target = event.target as HTMLInputElement | null
  const files = target?.files

  if (!files || files.length === 0) {
    return
  }

  busy.value = true
  error.value = null

  try {
    const available = remainingSlots.value
    const selected = Array.from(files).slice(0, available)
    const nextImages: string[] = []
    let runningTotal = existingBytes.value

    for (const file of selected) {
      if (!file.type.startsWith('image/')) {
        error.value = 'Only image files are allowed.'
        continue
      }

      if (file.size > props.maxSizeBytes) {
        error.value = `Images must be under ${Math.round(props.maxSizeBytes / (1024 * 1024))}MB.`
        continue
      }

      if (props.maxTotalBytes && runningTotal + file.size > props.maxTotalBytes) {
        error.value = `Total images must be under ${Math.round(props.maxTotalBytes / (1024 * 1024))}MB.`
        continue
      }

      const dataUrl = await readFileAsDataUrl(file)
      runningTotal += file.size
      nextImages.push(dataUrl)
    }

    if (nextImages.length) {
      const merged = [...model.value, ...nextImages].slice(0, props.maxImages)
      model.value = merged
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to add image.'
    error.value = message
  }
  finally {
    busy.value = false
    resetInput(event)
  }
}

function removeImage(index: number) {
  if (isDisabled.value) return
  model.value = model.value.filter((_, idx) => idx !== index)
}
</script>

<template>
  <div class="image-attachment">
    <div class="image-attachment__header">
      <div>
        <p class="text-subtitle-1 mb-1">
          {{ props.label }}
        </p>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ props.hint }}
        </p>
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        size="small"
        :disabled="isDisabled || remainingSlots === 0"
        prepend-icon="mdi-camera-plus"
        @click="triggerPicker"
      >
        Add image
      </v-btn>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="d-none"
      multiple
      :disabled="isDisabled || remainingSlots === 0"
      @change="handleFilesSelected"
    >

    <div
      v-if="model.length > 0"
      class="image-attachment__grid"
    >
      <div
        v-for="(image, index) in model"
        :key="index"
        class="image-attachment__preview"
      >
        <img
          :src="image"
          alt="Attachment preview"
        >
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="flat"
          class="image-attachment__remove"
          :disabled="isDisabled"
          @click="removeImage(index)"
        />
      </div>
    </div>

    <p
      v-if="error"
      class="image-attachment__error"
    >
      {{ error }}
    </p>
    <p
      v-else
      class="text-caption text-medium-emphasis mt-1 mb-0"
    >
      {{ remainingSlots }} image{{ remainingSlots === 1 ? '' : 's' }} left (max {{ props.maxImages }}).
    </p>
  </div>
</template>

<style scoped>
.image-attachment {
  border: 1px dashed rgba(var(--v-theme-outline), 0.4);
  border-radius: 12px;
  padding: 12px;
}

.image-attachment__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.image-attachment__grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-attachment__preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.image-attachment__preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-attachment__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(var(--v-theme-surface), 0.9);
}

.image-attachment__error {
  color: rgb(var(--v-theme-error));
  margin-top: 8px;
  margin-bottom: 0;
}
</style>
