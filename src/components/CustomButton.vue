<template>
    <button
        :type="type"
        :data-variant="variant"
        :data-color="color"
        :data-loading="isLoading"
        :disabled="isLoading || isDisabled"
        @click="onClick"
    >
        <slot />
    </button>
</template>

<script setup lang="ts">
const {
    type = 'button',
    variant = 'primary',
    color = 'primary',
    isLoading = false,
    isDisabled = false
} = defineProps<{
    type?: 'button' | 'submit'
    variant?: 'primary' | 'link' | 'outline'
    color?: 'primary' | 'danger'
    isLoading?: boolean
    isDisabled?: boolean
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
    font-family: var(--font-accent);
    @apply text-sm transition-colors flex justify-center font-semibold rounded-2xl space-x-2;
}

button:has(span:first-child) {
    @apply pl-4;
}

button:has(span:last-child) {
    @apply pr-4;
}

button[disabled] {
    @apply opacity-50;
}

button[data-loading='true'] {
    @apply animate-pulse opacity-50;
}

button[data-variant='primary'] {
    background-color: var(--color-primary);
    @apply text-white p-3 uppercase;
}

button[data-variant='outline'] {
    border-color: var(--color-primary);
    color: var(--color-primary);
    @apply p-3 uppercase border;
}

button[data-variant='link'] {
    @apply bg-transparent;
}

button[data-variant='link'][data-color='primary'] {
    color: var(--color-primary);
}

button[data-variant='link'][data-color='danger'] {
    color: var(--color-danger);
}

:slotted(svg) {
    @apply h-5 w-5 text-inherit;
}
</style>
