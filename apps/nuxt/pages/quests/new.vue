<script setup lang="ts">
import type { CreateQuestResponse } from '~/server/api/quests/index.post'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const title = ref('')
const goal = ref('')
const context = ref('')
const constraints = ref('')
const showOptionalFields = ref(false)

const valid = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const rules = {
  title: [(v: string) => !!v || 'Title is required'],
}

watch(
  [goal, context, constraints],
  (values) => {
    if (values.some(value => typeof value === 'string' && value.trim().length > 0)) {
      showOptionalFields.value = true
    }
  },
  { immediate: true },
)

async function submit() {
  loading.value = true
  error.value = null

  try {
    const res = await $fetch<CreateQuestResponse>('/api/quests', {
      method: 'POST',
      body: {
        title: title.value,
        goal: goal.value,
        context: context.value,
        constraints: constraints.value,
      },
    })

    if (res.success && res.quest?.id) {
      router.push(`/quests/${res.quest.id}`)
    }
    else {
      error.value = 'Failed to create quest'
    }
  }
  catch (e: unknown) {
    if (e instanceof Error) {
      error.value = e.message
    }
    else {
      error.value = 'Error creating quest'
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-row
      class="w-100"
      justify="center"
    >
      <v-col
        cols="12"
        sm="10"
        md="8"
        lg="6"
      >
        <v-card
          elevation="3"
          class="pa-6"
        >
          <v-card-title class="text-h5 text-md-h4 font-weight-bold mb-6 text-center">
            Create a New Quest
          </v-card-title>

          <v-form
            v-model="valid"
            @submit.prevent="submit"
          >
            <v-text-field
              v-model="title"
              label="Title"
              :rules="rules.title"
              required
            />

            <v-btn
              v-if="!showOptionalFields"
              type="button"
              variant="text"
              color="primary"
              class="mt-2"
              @click="showOptionalFields = true"
            >
              Add optional details
            </v-btn>

            <v-expand-transition>
              <div v-if="showOptionalFields">
                <v-textarea
                  v-model="goal"
                  label="What outcome are you aiming for?"
                  hint="Share the specific result you want this quest to achieve."
                  persistent-hint
                  auto-grow
                  rows="3"
                  class="mb-4"
                />

                <v-textarea
                  v-model="context"
                  label="Relevant background or context"
                  hint="Include any details, prior work, or information that will help the AI understand the situation."
                  persistent-hint
                  auto-grow
                  rows="3"
                  class="mb-4"
                />

                <v-textarea
                  v-model="constraints"
                  label="Constraints or preferences"
                  hint="List deadlines, available resources, tone, or other requirements to respect."
                  persistent-hint
                  auto-grow
                  rows="3"
                  class="mb-4"
                />

                <v-btn
                  type="button"
                  variant="text"
                  color="secondary"
                  class="mb-2"
                  @click="showOptionalFields = false"
                >
                  Hide optional details
                </v-btn>
              </div>
            </v-expand-transition>

            <v-row
              class="mt-4"
              justify="center"
              align="center"
            >
              <v-col
                cols="12"
                sm="6"
              >
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  :loading="loading"
                  :disabled="!valid || loading"
                >
                  Create Quest
                </v-btn>
              </v-col>
            </v-row>

            <!-- New Button to go to Quest List -->
            <v-row
              class="mt-2"
              justify="center"
              align="center"
            >
              <v-col
                cols="12"
                sm="6"
              >
                <v-btn
                  color="secondary"
                  block
                  :to="`/quests`"
                >
                  Back to Quests
                </v-btn>
              </v-col>
            </v-row>

            <v-alert
              v-if="error"
              type="error"
              class="mt-4"
              border="start"
              prominent
            >
              {{ error }}
            </v-alert>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
