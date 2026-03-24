<template>
    <button :type="type" :data-variant="variant" @click="onClick">
        <slot />
    </button>
</template>

<script setup lang="ts">
const { type = 'button', variant = 'primary' } = defineProps<{
    type?: 'button' | 'submit'
    variant?: 'primary' | 'link'
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

button[data-variant='primary'] {
    background-color: var(--color-primary);
    @apply text-white p-3 uppercase;
}

button[data-variant='link'] {
    color: var(--color-primary);
    @apply bg-transparent;
}

:slotted(svg) {
    @apply h-5 w-5 text-inherit;
}
</style>
