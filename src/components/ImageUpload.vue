<template>
    <div
        :class="{
            'rounded-2xl bg-white overflow-hidden': true,
            'py-16 px-7': !image
        }"
    >
        <div v-if="!image" class="flex flex-col items-center space-y-5">
            <div>
                <CustomButton @click="fileInputRef?.click()">Upload image</CustomButton>
            </div>
            <p class="text-xs text-gray-500">
                Upload a picture of your plant setup to get started.
            </p>
        </div>

        <input
            ref="file-input"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onImageSelected"
        />

        <VueCropper
            v-if="image"
            ref="cropper"
            :aspect-ratio="4 / 5"
            :src="image.originalFile.objectURL"
            :view-mode="1"
            :style="{ width: '100%' }"
            :data="image.croppedImg.data"
        />
    </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import VueCropper, { type CropperData, type VueCropperMethods } from 'vue-cropperjs'
import CustomButton from './CustomButton.vue'
import { getFileExtension } from '@/utils/file.utils'

export interface Image {
    originalFile: {
        extension: string
        objectURL: string
    }
    croppedImg: {
        blob: Blob
        objectURL: string
        data?: CropperData
    }
}

const image = defineModel<Image>('image')

const fileInputRef = useTemplateRef('file-input')
const cropper = useTemplateRef<VueCropperMethods>('cropper')

const onImageSelected = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
        const objectURL = URL.createObjectURL(file)
        image.value = {
            originalFile: {
                extension: getFileExtension(file),
                objectURL
            },
            croppedImg: {
                blob: file,
                objectURL
            }
        }
    }
}

defineExpose({
    confirmCrop: (onCropped?: (value: Image | null) => void) => {
        const cropperRef = cropper.value
        const imageRef = image.value
        if (imageRef && cropperRef) {
            const croppedData = cropperRef.getData()
            cropperRef
                .getCroppedCanvas({
                    width: 1080,
                    height: 1350
                })
                .toBlob(blob => {
                    if (blob) {
                        const value = {
                            blob,
                            objectURL: URL.createObjectURL(blob),
                            data: croppedData
                        }
                        imageRef.croppedImg = value
                        onCropped?.(image.value ?? null)
                    }
                })
        }
    }
})
</script>
