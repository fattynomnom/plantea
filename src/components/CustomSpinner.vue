<template>
    <div
        :class="{
            relative: true,
            'h-28 w-28': Boolean($slots.default)
        }"
    >
        <svg
            class="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                :stroke-width="strokeWidth"
            />
            <circle
                class="opacity-75"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                :stroke-width="strokeWidth"
                stroke-linecap="round"
                :stroke-dasharray="`${arcLength} ${circumference}`"
            />
        </svg>
        <span class="absolute left-0 top-0 w-full h-full flex flex-col justify-center items-center">
            <slot />
        </span>
    </div>
</template>

<script setup lang="ts">
const TRACK_RADIUS = 10
const circumference = 2 * Math.PI * TRACK_RADIUS
const arcLength = circumference * 0.35

const { strokeWidth = 4 } = defineProps<{
    strokeWidth?: number
}>()
</script>
