<template>
    <Transition name="opacity">
        <div
            v-if="visible"
            class="absolute left-0 right-0 top-0 bottom-0 backdrop-blur-sm bg-gray-500/50 z-20"
            @click="visible = false"
        />
    </Transition>
    <TransitionGroup :name="visible ? 'slide-left' : 'slide-right'">
        <div
            v-if="visible"
            :class="`absolute right-0 top-0 bottom-0 bg-color-primary rounded-l-2xl w-1/2 z-20 flex flex-col p-5 space-y-5 ${drawerClass}`"
        >
            <XMarkIcon class="h-5 w-5 ml-auto" @click="visible = false" />

            <slot />
        </div>
    </TransitionGroup>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

const visible = defineModel<boolean>('visible', { required: true })

const { drawerClass = '' } = defineProps<{
    drawerClass?: string
}>()
</script>

<style scoped>
.opacity-enter-active,
.opacity-leave-active {
    transition: all 0.15s ease-out;
}

.opacity-enter-from,
.opacity-leave-to {
    opacity: 0;
}

.slide-left-move,
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-move,
.slide-right-enter-active,
.slide-right-leave-active {
    transition: all 0.25s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
    transform: translateX(-50%);
    @apply opacity-0;
}

.slide-left-leave-active,
.slide-right-leave-active {
    @apply absolute left-0 right-0 opacity-0;
}

.slide-right-enter-from,
.slide-right-leave-to {
    transform: translateX(50%);
    @apply opacity-0;
}
</style>
