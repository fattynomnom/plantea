<template>
    <div class="relative">
        <img
            ref="image"
            :alt="imageName"
            :src="downloadUrl"
            width="200"
            height="200"
            class="w-full cursor-pointer rounded-2xl shadow-lg"
        />

        <div
            v-for="(plant, plantIndex) in plants"
            :key="plant.name + plantIndex"
            :class="{
                'absolute rounded-full border border-white outline outline-offset-2 outline-white h-[50px] w-[50px] flex flex-col justify-center': true,
                'overflow-hidden': plant.isWateredToday
            }"
            :style="{
                left: `${plant.position.x - 25}px`,
                top: `${plant.position.y - 25}px`
            }"
        >
            <template v-if="plant.isWateredToday">
                <div
                    class="bg-white h-full w-full absolute left-0 right-0 top-0 bottom-0 opacity-30"
                />
                <CheckIcon class="text-white h-8 w-8 m-auto" />
            </template>
            <div
                v-else-if="plant.shouldBeWatered"
                class="absolute bg-green-900 -bottom-2 -right-2 rounded-full"
            >
                <ExclamationCircleIcon class="text-white h-6 w-6" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useDownloadUrlQuery } from '@/composables/useDownloadUrlQuery'
import { CheckIcon } from '@heroicons/vue/24/outline'
import { ExclamationCircleIcon } from '@heroicons/vue/24/solid'

interface Plant {
    position: {
        x: number
        y: number
    }
    name: string
    isWateredToday: boolean
    shouldBeWatered: boolean
}

const { imageName, plants } = defineProps<{
    imageName: string
    plants: Plant[]
}>()

const { data: downloadUrl } = useDownloadUrlQuery(imageName)
</script>
