<template>
    <div class="relative">
        <img
            ref="image"
            :alt="image.name"
            :src="image.objectURL ?? downloadUrl"
            width="200"
            height="200"
            class="w-full cursor-pointer rounded-2xl"
            @click="$emit('imgClick', $event, imageRef?.getBoundingClientRect())"
        />
        <PlantIndicator
            v-for="(plant, plantIndex) in plants"
            :key="plant.name + plantIndex"
            :color="plant.color"
            class="absolute cursor-pointer hover:scale-150 transition ease-in-out duration-300"
            :style="{
                left: `${plant.position.x}px`,
                top: `${plant.position.y}px`,
                transform: `scale(${enlargedIndicatorIndex === plantIndex ? 2.5 : 1})`
            }"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import PlantIndicator from './PlantIndicator.vue'
import { useDownloadUrlQuery } from '@/composables/useDownloadUrlQuery'

interface Image {
    name: string
    objectURL?: string
}

interface Plant {
    position: {
        x: number
        y: number
    }
    color: string
    name: string
}

const { image, plants, enlargedIndicatorIndex } = defineProps<{
    image: Image
    plants: Plant[]
    enlargedIndicatorIndex?: number
}>()

defineEmits<{
    (e: 'imgClick', event: PointerEvent, imgPosition?: { left: number; top: number }): void
}>()

const imageRef = useTemplateRef('image')

const queryFileName = computed(() => (image.objectURL ? undefined : image.name))

const { data: downloadUrl } = useDownloadUrlQuery(queryFileName)
</script>
