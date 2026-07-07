<template>
    <PlantSetupForm
        title="Edit setup"
        :initial-setup="setup"
        :is-saving="isLoading"
        @save="onSubmit"
    />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { updateSetupAndPlants } from '@/models/setup'
import { useToast } from '@/composables/useToast'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import { getColorFromIndex } from '@/utils/colors.utils'
import PlantSetupForm, { type PlantSetupFormData } from '@/components/PlantSetupForm.vue'

const route = useRoute()
const router = useRouter()

const { displayGenericError } = useToast()

const { data: setups, invalidateSetupsQuery } = useSetupsQuery()

const setup = computed<PlantSetupFormData>(() => {
    const setupsRef = setups.value
    if (setupsRef) {
        const data = setupsRef.find(({ id }) => route.params.id === id)
        if (data) {
            return {
                ...data,
                plants: data.plants.map(({ id, setup, name, datetimes, frequencyDays }, index) => ({
                    id,
                    positionPercentage: setup.positionPercentage,
                    color: getColorFromIndex(index),
                    name,
                    dates: datetimes.map(datetime => new Date(datetime)),
                    originalDatetimes: datetimes,
                    frequencyDays
                }))
            }
        }
    }

    return { plants: [] }
})

// #region submission
const isLoading = ref(false)

const onSubmit = async (data: PlantSetupFormData) => {
    isLoading.value = true

    try {
        if (!data.id) {
            throw new Error('Missing id.')
        }

        if (!data.imgName) {
            throw new Error('Missing imgName.')
        }

        await updateSetupAndPlants(
            {
                ...data,
                id: data.id,
                imgName: data.imgName
            },
            data.plants.map(({ dates, ...plant }) => ({
                id: plant.id,
                name: plant.name,
                datetimes: dates.map(date => date.getTime()),
                frequencyDays: plant.frequencyDays,
                positionPercentage: plant.positionPercentage,
                originalDatetimes: plant.originalDatetimes
            })),
            () => {},
            () => {
                isLoading.value = false
                invalidateSetupsQuery()
                router.push('/')
            }
        )
    } catch (error) {
        console.log('EditPlantsView onSubmit error', error)
        isLoading.value = false
        displayGenericError()
    }
}
// #endregion
</script>
