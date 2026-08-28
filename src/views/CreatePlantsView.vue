<template>
    <PlantSetupForm
        title="Create setup"
        :initial-setup="{
            plants: []
        }"
        :is-saving="isLoading"
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

const onSubmit = async (data: PlantSetupFormData) => {
    isLoading.value = true

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
            data.plants.map(({ positionPercentage, name, dates }) => ({
                name,
                positionPercentage,
                datetimes: dates.map(date => date.getTime())
            })),
            () => {},
            () => {
                isLoading.value = false
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
