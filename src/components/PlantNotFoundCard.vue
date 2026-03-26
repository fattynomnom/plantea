<template>
    <div class="rounded-2xl p-5 bg-white shadow-lg flex flex-col justify-center space-y-5">
        <div class="space-y-3 text-center">
            <h2 class="text-gray-500 font-bold">404 plants not found.</h2>
            <small>Add a plant to get started.</small>
        </div>

        <CustomButton @click="$emit('add-plant')">
            <PlusCircleIcon />
            <span>Add plant setup</span>
        </CustomButton>
    </div>
</template>

<script setup lang="ts">
import { PlusCircleIcon } from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'

defineEmits<{
    (event: 'add-plant'): void
}>()
</script>
