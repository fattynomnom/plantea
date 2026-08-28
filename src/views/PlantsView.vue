<template>
    <main class="h-full space-y-7 px-7 pb-7 overflow-y-scroll">
        <div class="space-y-3">
            <h2>Quick actions</h2>

            <CustomButton class="w-full" @click="isPlantsDrawerVisible = true">
                <PlusIcon />
                <span>Add plant</span>
            </CustomButton>

            <CustomButton class="w-full" @click="isPredictionOpen = true">
                <SparklesIcon />
                <span>Generate future predictions</span>
            </CustomButton>

            <CustomButton class="w-full" @click="isPredictionOpen = true">
                <SparklesIcon />
                <span>Add setup</span>
            </CustomButton>
        </div>

        <div class="space-y-3">
            <h2>Which plants have you watered today?</h2>

            <div v-if="isLoading" class="grid grid-cols-2 gap-3">
                <Skeleton v-for="index in 6" :key="`plant-skeleton-${index}`" class="!h-10" />
            </div>

            <template v-else-if="hasPlants">
                <PlantSetup
                    v-for="setup in setups"
                    :key="setup.id"
                    :setup="setup"
                    :plants="setup.plants"
                    @edit="editPlant"
                />

                <ul v-if="plants" class="grid grid-cols-2 gap-3">
                    <li v-for="(plant, index) in plants.singlePlants" :key="plant.id">
                        <PlantCard
                            class="bg-white h-full"
                            :plant="plant"
                            :is-watering="isWateringLoading[index] ?? false"
                            @water="onWaterPlantClick(plant, index)"
                            @edit="editPlant(plant)"
                        >
                            <h3>{{ plant.name }}</h3>
                        </PlantCard>
                    </li>
                </ul>
            </template>

            <PlantNotFoundCard v-else @add-plant="isPlantsDrawerVisible = true" />
        </div>
    </main>

    <PredictionDrawer v-model:visible="isPredictionOpen" />

    <PlantsDrawer
        v-model:visible="isPlantsDrawerVisible"
        :is-loading="isSubmittingPlant"
        :initial-value="plant"
        :title="plant.id ? 'Edit plant' : 'Add new plant'"
        @submit="onSubmitPlantForm"
    />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PlantNotFoundCard from '@/components/PlantNotFoundCard.vue'
import { markPlantWatered, type Plant } from '@/models/plant'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import { Skeleton } from 'primevue'
import { useToast } from '@/composables/useToast'
import { usePlantsDrawer } from '@/composables/usePlantsDrawer'
import CustomButton from '@/components/CustomButton.vue'
import { SparklesIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { useFirebaseUser } from '@/composables/useFirebaseUser'
import PredictionDrawer from '@/components/PredictionDrawer.vue'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import PlantSetup from '@/components/PlantSetup.vue'
import PlantsDrawer from '@/components/PlantsDrawer.vue'
import PlantCard from '@/components/PlantCard.vue'

const { user } = useFirebaseUser()

const {
    isPlantsDrawerVisible,
    isLoading: isSubmittingPlant,
    plant,
    editPlant,
    onSubmitPlantForm
} = usePlantsDrawer()

const { data: plants, invalidatePlantsQuery } = usePlantsQuery()

const { data: setups } = useSetupsQuery()

const { displayGenericError } = useToast()

const hasPlants = computed(() =>
    Boolean(plants.value?.singlePlants.length || plants.value?.plantsWithSetup.length)
)

const isLoading = computed(
    () => user.value === undefined || plants.value === undefined || setups.value === undefined
)

const isWateringLoading = ref<boolean[]>([])
const isPredictionOpen = ref(false)

const onWaterPlantClick = async (plant: Omit<Plant, 'shouldBeWatered'>, index: number) => {
    isWateringLoading.value[index] = true

    try {
        await markPlantWatered(plant)
        await invalidatePlantsQuery()
    } catch (error) {
        console.log('Error', error)
        displayGenericError()
    } finally {
        isWateringLoading.value[index] = false
    }
}

watch(
    () => plants.value?.singlePlants,
    value => {
        isWateringLoading.value = Array.from({ length: value?.length ?? 0 }, () => false)
    }
)
</script>

<style scoped>
.p-accordioncontent-content p {
    @apply text-sm;
}
</style>
