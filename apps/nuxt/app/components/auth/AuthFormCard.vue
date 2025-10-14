<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  submitLabel: string
  submitColor?: string
  loading?: boolean
  error?: string | null
  switchLabel?: string
  switchTo?: string
  disableSubmitWhenInvalid?: boolean
}>(), {
  submitColor: 'primary',
  loading: false,
  error: null,
  switchLabel: '',
  switchTo: '',
  disableSubmitWhenInvalid: true,
})

const emit = defineEmits<{ submit: [] }>()

const valid = defineModel<boolean>('valid', { default: false })

const disableSubmit = computed(() => {
  return (props.disableSubmitWhenInvalid && !valid.value) || props.loading
})

function handleSubmit() {
  emit('submit')
}
</script>

<template>
  <v-container class="d-flex justify-center">
    <v-card
      class="pa-6"
      max-width="400"
    >
      <v-card-title>{{ title }}</v-card-title>
      <v-form
        v-model="valid"
        @submit.prevent="handleSubmit"
      >
        <slot />
        <v-btn
          type="submit"
          :color="submitColor"
          block
          class="mt-4 mb-2"
          :loading="loading"
          :disabled="disableSubmit"
        >
          {{ submitLabel }}
        </v-btn>
        <slot name="secondary" />
        <v-btn
          v-if="switchLabel && switchTo"
          variant="text"
          :to="switchTo"
        >
          {{ switchLabel }}
        </v-btn>
        <v-alert
          v-if="error"
          type="error"
          class="mt-2"
        >
          {{ error }}
        </v-alert>
      </v-form>
    </v-card>
  </v-container>
</template>
