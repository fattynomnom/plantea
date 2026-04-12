<template>
    <div :class="`grid ${size === 'default' ? 'grid-cols-3' : 'grid-cols-4'} gap-4`">
        <div v-for="(file, index) of files" :key="file.name + index" class="relative">
            <div
                :class="{
                    'w-full transition duration-300 transform rounded-xl overflow-hidden': true,
                    'outline outline-offset-2 outline-green-600': index === selectedIndex
                }"
                @click="$emit('click', index)"
            >
                <img
                    :alt="file.name"
                    :src="file.objectURL"
                    width="200"
                    height="200"
                    class="object-cover aspect-square w-full"
                    data-file="true"
                />
            </div>

            <div
                v-if="index !== selectedIndex"
                class="rounded-full absolute -top-1.5 -right-1.5 text-white bg-color-primary p-2"
                @click="$emit('remove', index)"
            >
                <XMarkIcon class="w-3 h-3" />
            </div>
        </div>
        <div
            v-if="addButton"
            class="bg-color-default rounded-xl w-full flex items-center justify-center cursor-pointer"
            @click="$emit('add')"
        >
            <PlusIcon
                class="p-[30%] h-full w-full color-primary transition duration-300 transform hover:blur-sm"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const {
    files = [],
    addButton = false,
    size = 'default',
    selectedIndex
} = defineProps<{
    files?: File[]
    addButton?: boolean
    size?: 'small' | 'default'
    selectedIndex?: number
}>()

defineEmits<{
    (e: 'click', index: number): void
    (e: 'remove', index: number): void
    (e: 'add'): void
}>()
</script>
