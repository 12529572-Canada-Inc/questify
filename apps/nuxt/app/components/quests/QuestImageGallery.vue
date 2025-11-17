<script setup lang="ts">
const props = defineProps<{
  images: string[]
  title?: string
}>()
</script>

<template>
  <div class="quest-image-gallery">
    <div class="quest-image-gallery__header">
      <h3 class="text-subtitle-1 font-weight-medium mb-1">
        {{ props.title || 'Quest images' }}
      </h3>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Saved when the quest was created to help with context later.
      </p>
    </div>
    <div class="quest-image-gallery__grid">
      <v-img
        v-for="(image, index) in props.images"
        :key="index"
        :src="image"
        aspect-ratio="4/3"
        class="quest-image-gallery__image"
        cover
      >
        <template #placeholder>
          <div class="quest-image-gallery__placeholder d-flex align-center justify-center">
            <v-progress-circular
              color="primary"
              indeterminate
              size="22"
              width="3"
            />
          </div>
        </template>
      </v-img>
    </div>
  </div>
</template>

<style scoped>
.quest-image-gallery {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quest-image-gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.quest-image-gallery__image {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-outline), 0.16);
  background: rgba(var(--v-theme-surface-variant), 0.2);
}

.quest-image-gallery__placeholder {
  height: 100%;
  background: rgba(var(--v-theme-surface-variant), 0.4);
}
</style>
