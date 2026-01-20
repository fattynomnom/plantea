<template>
    <main class="relative h-full main-padding space-y-3">
        <div class="flex items-center justify-between px-2">
            <h2>Have you watered your plants?</h2>

            <CustomButton variant="link" @click="isDrawerVisible = true">
                <PlusCircleIcon />
                <span>Add plant setup</span>
            </CustomButton>
        </div>

        <div
            class="rounded-2xl px-5 py-16 bg-gray-100 dark:bg-gray-800 shadow-lg flex flex-col justify-center text-center space-y-10"
        >
            <div class="space-y-3">
                <h2 class="text-gray-500 dark:text-gray-400 font-bold">404 plants not found.</h2>
                <small class="font-normal dark:text-gray-400">
                    Add a plant setup to get started.
                </small>
            </div>

            <CustomButton variant="link" @click="isDrawerVisible = true">
                <PlusCircleIcon />
                <span>Add plant setup</span>
            </CustomButton>
        </div>

        <SignInDialog />

        <AddPlantsV2 v-model:visible="isDrawerVisible" />
    </main>
</template>

<script setup lang="ts">
import { PlusCircleIcon } from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import SignInDialog from '@/components/SignInDialog.vue'
import { ref } from 'vue'
import AddPlantsV2 from '@/components/AddPlantsV2.vue'

const isDrawerVisible = ref(false)
</script>
