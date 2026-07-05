<template>
    <Drawer v-model:visible="visible" header="Replace image" position="bottom">
        <div class="space-y-7 px-7">
            <ImageUpload ref="image-upload" v-model:image="image" />

            <div class="flex justify-between pb-7">
                <CustomButton
                    variant="outline"
                    @click="
                        () => {
                            visible = false
                            image = undefined
                        }
                    "
                >
                    Cancel
                </CustomButton>

                <CustomButton :is-disabled="!image" @click="onSave"> Save </CustomButton>
            </div>
        </div>
    </Drawer>
</template>

<script setup lang="ts">
import CustomButton from '@/components/CustomButton.vue'
import Drawer from 'primevue/drawer'
import { ref, useTemplateRef } from 'vue'
import ImageUpload from '@/components/ImageUpload.vue'
import type { Image } from '@/components/ImageUpload.vue'

const visible = defineModel<boolean>('visible', { required: true })

const emit = defineEmits<{
    (e: 'save', croppedImg: Image | null): Promise<void>
}>()

const image = ref<Image>()

const imageUpload = useTemplateRef('image-upload')

const onSave = () => {
    const imageRef = image.value
    if (!imageRef) {
        return
    }

    imageUpload.value?.confirmCrop(value => {
        emit('save', value)
    })

    visible.value = false
}
</script>
