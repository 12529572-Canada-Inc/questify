<script setup lang="ts">
const props = defineProps<{
  value: string
  size?: number
  alt?: string
}>()

const resolvedSize = computed(() => props.size ?? 220)
const dataUrl = ref<string | null>(null)
const renderError = ref<string | null>(null)
const isClient = computed(() => import.meta.client)

async function generate() {
  if (!isClient.value) {
    return
  }

  try {
    const qr = await import('qrcode')
    dataUrl.value = await qr.toDataURL(props.value, {
      width: resolvedSize.value,
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
    renderError.value = null
  }
  catch (err) {
    console.error('Failed to render QR code', err)
    renderError.value = 'Unable to render QR code.'
    dataUrl.value = null
  }
}

watch(
  () => props.value,
  () => {
    dataUrl.value = null
    renderError.value = null
    generate()
  },
)

onMounted(() => {
  generate()
})
</script>

<template>
  <div class="qr-code">
    <div
      v-if="!isClient"
      class="qr-code__placeholder"
      :style="{ width: `${resolvedSize}px`, height: `${resolvedSize}px` }"
    >
      <v-progress-circular
        indeterminate
        color="primary"
      />
    </div>

    <template v-else>
      <div
        v-if="renderError"
        class="qr-code__error"
        :style="{ width: `${resolvedSize}px` }"
      >
        <p class="qr-code__error-message">
          {{ renderError }}
        </p>
      </div>

      <div
        v-else-if="dataUrl"
        class="qr-code__image"
        :style="{ width: `${resolvedSize}px`, height: `${resolvedSize}px` }"
      >
        <v-img
          :src="dataUrl"
          :alt="alt ?? 'QR code'"
          :width="resolvedSize"
          :height="resolvedSize"
          cover
        />
      </div>

      <div
        v-else
        class="qr-code__placeholder"
        :style="{ width: `${resolvedSize}px`, height: `${resolvedSize}px` }"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.qr-code {
  display: flex;
  justify-content: center;
}

.qr-code__placeholder,
.qr-code__image,
.qr-code__error {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 16px;
}

.qr-code__error-message {
  width: 100%;
  font-size: 0.9rem;
  color: rgb(var(--v-theme-error));
  text-align: center;
}
</style>
