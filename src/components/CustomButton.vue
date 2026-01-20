<template>
    <button type="button" :data-variant="variant" @click="onClick">
        <slot />
    </button>
</template>

<script setup lang="ts">
const { variant = 'primary' } = defineProps<{
    variant?: 'primary' | 'secondary' | 'link' | 'accent'
}>()

// The explicitly defined emits, onClick function & defineExpose
// is so that we can use ref on wherever this child component is used
// and programmatically click it
// for sample usage, see ImageUpload component
const emit = defineEmits<{
    (e: 'click'): void
}>()

const onClick = () => {
    emit('click')
}

defineExpose({
    onClick
})
</script>

<style scoped>
button {
    @apply text-sm transition-colors flex justify-center;
}

button[data-variant='primary'] {
    font-family: var(--font-accent);
    @apply font-semibold bg-gray-700 dark:bg-gray-800 text-white p-3 rounded-2xl uppercase hover:bg-gray-800 hover:dark:bg-gray-700 space-x-2;
}

button[data-variant='accent'] {
    font-family: var(--font-accent);
    @apply font-semibold bg-gray-700 dark:bg-indigo-500 text-white p-3 rounded-2xl uppercase hover:bg-gray-800 hover:dark:bg-gray-700 space-x-2;
}

button[data-variant='link'] {
    @apply text-indigo-500 space-x-2 hover:text-indigo-400;
}

:slotted(svg) {
    @apply h-5 w-5 text-inherit;
}
</style>
