<template>
    <div
        :style="{
            border: `1px solid var(--color-${color}-400)`
        }"
        class="rounded-full p-0.5"
    >
        <div
            class="h-2 w-2 rounded-full"
            :style="{
                backgroundColor: `var(--color-${color}-400)`
            }"
        />
    </div>
</template>

<script setup lang="ts">
const { color } = defineProps<{
    color: string
}>()
</script>
