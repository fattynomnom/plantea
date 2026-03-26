<template>
    <!-- @vue-ignore -->
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
            <div v-if="files.length" class="grid grid-cols-3 gap-4">
                <div
                    v-for="(file, index) of files"
                    :key="file.name + index"
                    class="relative rounded-xl overflow-hidden"
                >
                    <div class="w-full transition duration-300 transform hover:blur-sm">
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
                        class="w-full h-full absolute top-0 left-0 flex flex-col items-center justify-center backdrop-blur-sm opacity-0 transition-opacity duration-300 transform hover:opacity-100"
                    >
                        <CustomButton>
                            <TrashIcon @click="removeFileCallback(index)" />
                        </CustomButton>
                    </div>
                </div>
                <div
                    class="border border-gray-700 rounded-xl w-full flex items-center justify-center cursor-pointer"
                    @click="uploadButton?.onClick()"
                >
                    <PlusIcon
                        class="p-[30%] h-full w-full text-gray-700 transition duration-300 transform hover:blur-sm"
                    />
                </div>
            </div>
        </template>
        <template #empty>
            <p class="text-xs text-gray-500 text-center">
                You can also drag and drop files to here to upload.
            </p>
        </template>
    </FileUpload>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { FileUpload } from 'primevue'
import CustomButton from './CustomButton.vue'
import { PlusCircleIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
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
