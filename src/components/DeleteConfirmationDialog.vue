<template>
    <Dialog v-model:visible="visible" modal header="Delete plant">
        <div class="space-y-7">
            <p>
                <slot />
            </p>
            <div class="flex justify-between space-x-2">
                <CustomButton
                    type="button"
                    variant="outline"
                    :is-loading="isLoading"
                    @click="visible = false"
                >
                    Cancel
                </CustomButton>
                <CustomButton type="button" :is-loading="isLoading" @click="$emit('confirm')">
                    <span>Delete</span>
                    <TrashIcon />
                </CustomButton>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { Dialog } from 'primevue'

const visible = defineModel<boolean>('visible', { required: true })

const { isLoading } = defineProps<{
    isLoading: boolean
}>()

defineEmits<{
    (e: 'confirm'): Promise<void>
}>()
</script>
