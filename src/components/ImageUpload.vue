<template>
    <FileUpload
        ref="file-upload"
        name="plant-setup"
        accept="image/*"
        multiple
        @select="({ files }) => $emit('update', files)"
        @remove="({ files }) => $emit('update', files)"
    >
        <template #header="{ files, chooseCallback }">
            <div class="m-auto">
                <CustomButton
                    ref="upload-button"
                    :class="`${files.length ? '!hidden' : ''}`"
                    @click="chooseCallback"
                >
                    <PlusCircleIcon />
                    <span>Upload file</span>
                </CustomButton>
            </div>
        </template>
        <template #content="{ files, removeFileCallback }">
            <FilesList
                v-if="files.length"
                :files="files"
                add-button
                @remove="removeFileCallback"
                @add="uploadButton?.onClick"
            />
        </template>
        <template #empty>
            <p class="text-xs text-gray-500 text-center">
                Upload pictures of your plant setup to get started.
            </p>
        </template>
    </FileUpload>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { FileUpload } from 'primevue'
import CustomButton from './CustomButton.vue'
import FilesList from './FilesList.vue'
import { PlusCircleIcon } from '@heroicons/vue/24/outline'
import { onMounted, useTemplateRef } from 'vue'

const { initialFiles = [] } = defineProps<{
    initialFiles?: File[]
}>()

defineEmits<{
    (e: 'update', files: File[]): void
}>()

const uploadButton = useTemplateRef('upload-button')
const fileUpload = useTemplateRef('file-upload')

onMounted(() => {
    if (initialFiles.length) {
        fileUpload.value?.onFileSelect({ target: { files: initialFiles } })
    }
})
</script>
