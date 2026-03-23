<template>
    <button :type="type" @click="onClick">
        <slot />
    </button>
</template>

<script setup lang="ts">
const { type = 'button' } = defineProps<{
    type?: 'button' | 'submit'
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
    background-color: var(--color-primary);
    @apply text-sm text-white transition-colors flex justify-center font-semibold p-3 rounded-2xl uppercase space-x-2;
}

:slotted(svg) {
    @apply h-5 w-5 text-inherit;
}
</style>
