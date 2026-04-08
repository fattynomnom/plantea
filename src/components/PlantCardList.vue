<template>
    <ul class="grid grid-cols-2 gap-3">
        <li
            v-for="(plant, index) in plants"
            :key="plant.id"
            :class="{
                'px-4 py-2 bg-white shadow-lg rounded-2xl flex items-center space-x-2': true,
                'opacity-50': plant.isWateredToday || isLoading[index],
                'animate-pulse': isLoading[index]
            }"
            @click="$emit('click', plant, index)"
        >
            <div class="flex-1 flex flex-col justify-center">
                <small class="text-xs uppercase font-bold">{{ plant.area }}</small>
                <span> {{ plant.name }} {{ plant.isWateredToday ? '(WATERED)' : '' }} </span>
            </div>
            <ExclamationCircleIcon
                v-if="plant.shouldBeWatered"
                class="flex-shrink-0 w-5 h-5 color-danger"
            />
        </li>
    </ul>
</template>

<script setup lang="ts">
import type { Plant } from '@/models/plant'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const { plants = [], isLoading = [] } = defineProps<{
    plants?: Plant[]
    isLoading?: boolean[]
}>()

defineEmits<{
    (e: 'click', plant: Plant, index: number): void
}>()
</script>
