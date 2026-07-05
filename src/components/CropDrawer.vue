<template>
    <Drawer v-model:visible="visible" header="Crop image" position="bottom">
        <div class="space-y-7 px-7">
            <div class="rounded-2xl overflow-hidden">
                <VueCropper
                    ref="cropper"
                    :aspect-ratio="4 / 5"
                    :src="url"
                    :view-mode="1"
                    :style="{ width: '100%' }"
                    :data="data"
                />
            </div>

            <div class="flex justify-between pb-7">
                <CustomButton variant="outline" @click="visible = false">Cancel</CustomButton>
                <CustomButton @click="onSave">Save</CustomButton>
            </div>
        </div>
    </Drawer>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import Drawer from 'primevue/drawer'
import VueCropper, { type CropperData, type VueCropperMethods } from 'vue-cropperjs'
import CustomButton from '@/components/CustomButton.vue'

export interface CropDrawerSaveEmitterValue {
    blob: Blob
    objectURL: string
}

const visible = defineModel<boolean>('visible', { required: true })

const { url, data } = defineProps<{
    url: string
    data?: CropperData
}>()

const emit = defineEmits<{
    (e: 'save', value: CropDrawerSaveEmitterValue): Promise<void>
}>()

const cropper = useTemplateRef<VueCropperMethods>('cropper')

const onSave = () => {
    const cropperRef = cropper.value
    if (!cropperRef) {
        return
    }

    cropperRef
        .getCroppedCanvas({
            width: 1080,
            height: 1350
        })
        .toBlob(blob => {
            if (blob) {
                emit('save', {
                    blob,
                    objectURL: URL.createObjectURL(blob)
                })
            }
        })
}
</script>
