<template>
    <PlantSetupForm
        title="Create setup"
        :initial-setup="{
            plants: []
        }"
        :is-saving="isLoading"
        :upload-progress="uploadProgress"
        @save="onSubmit"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { uploadAndCreateSetup } from '@/models/setup'
import { useToast } from '@/composables/useToast'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import PlantSetupForm, { type PlantSetupFormData } from '@/components/PlantSetupForm.vue'

const router = useRouter()

const { displayGenericError } = useToast()

const { invalidateSetupsQuery } = useSetupsQuery()

// #region submission
const isLoading = ref(false)
const uploadProgress = ref(0)

const resetLoading = () => {
    isLoading.value = true
    uploadProgress.value = 0
}

const onSubmit = async (data: PlantSetupFormData) => {
    resetLoading()

    try {
        if (!data.file) {
            throw new Error('No file found.')
        }

        await uploadAndCreateSetup(
            {
                file: {
                    extension: data.file.extension,
                    croppedImgBlob: data.file.croppedImgBlob
                },
                area: data.area
            },
            data.plants.map(({ positionPercentage, name, dates, frequencyDays }) => ({
                name,
                positionPercentage,
                datetimes: dates.map(date => date.getTime()),
                frequencyDays
            })),
            progress => {
                uploadProgress.value = progress
            },
            () => {
                resetLoading()
                invalidateSetupsQuery()
                router.push('/')
            }
        )
    } catch (error) {
        console.log('CreatePlantsView onSubmit error', error)
        isLoading.value = false
        displayGenericError()
    }
}
// #endregion
</script>
