<template>
    <main class="h-full w-full space-y-5 px-7 pb-7 overflow-y-scroll overflow-x-hidden">
        <h2>Which plants have you watered today?</h2>

        <div class="space-y-3">
            <div class="flex justify-between">
                <h3>Filter by area</h3>
                <CustomButton variant="link" @click="selectedArea = null">Clear</CustomButton>
            </div>

            <div v-if="isLoading" class="grid grid-cols-5 gap-2">
                <Skeleton v-for="index in 5" :key="`area-filter-skeleton-${index}`" class="!h-7" />
            </div>

            <div class="flex flex-wrap gap-2">
                <div
                    v-for="[area, plantsCount] in Object.entries(areaPlantsCount)"
                    :key="area"
                    :class="{
                        'py-2 px-3 bg-white rounded-2xl text-xs uppercase tracking-wide': true,
                        'border border-green-900': selectedArea === area
                    }"
                    @click="toggleFilter(area)"
                >
                    {{ area }} ({{ plantsCount }})
                </div>
            </div>
        </div>

        <div v-if="isLoading" class="grid grid-cols-2 gap-3">
            <Skeleton v-for="index in 6" :key="`plant-skeleton-${index}`" class="!h-10" />
        </div>

        <div v-else-if="hasPlants" class="space-y-3">
            <PlantSetup
                v-for="setup in filteredSetups"
                :key="setup.id"
                :setup="setup"
                :plants="setup.plants"
                @edit="openEditDrawer"
            />

            <ul v-if="plants" class="grid grid-cols-2 gap-3">
                <li v-for="(plant, index) in filteredSinglePlants" :key="plant.id">
                    <PlantCard
                        class="bg-white h-full"
                        :plant="plant"
                        :is-watering="isWateringLoading[index] ?? false"
                        @water="onWaterPlantClick(plant, index)"
                        @edit="openEditDrawer(plant)"
                    >
                        <h3>{{ plant.name }}</h3>
                    </PlantCard>
                </li>
            </ul>
        </div>

        <PlantNotFoundCard v-else @add-plant="isPlantsDrawerVisible = true" />
    </main>

    <PlantsDrawer
        v-model:visible="isPlantsDrawerVisible"
        :is-loading="isSubmittingPlant"
        :initial-value="plant"
        :title="plant.id ? 'Edit plant' : 'Add new plant'"
        @submit="onSubmitPlantForm"
        @delete="onDeletePlant"
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
import { useFirebaseUser } from '@/composables/useFirebaseUser'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import PlantSetup from '@/components/PlantSetup.vue'
import PlantsDrawer from '@/components/PlantsDrawer.vue'
import PlantCard from '@/components/PlantCard.vue'

const { user } = useFirebaseUser()

const {
    isPlantsDrawerVisible,
    isLoading: isSubmittingPlant,
    plant,
    openEditDrawer,
    onSubmitPlantForm
} = usePlantsDrawer()

const { data: plants, invalidatePlantsQuery } = usePlantsQuery()

const { data: setups, invalidateSetupsQuery } = useSetupsQuery()

const { displayGenericError, displayToast } = useToast()

const hasPlants = computed(() =>
    Boolean(plants.value?.singlePlants.length || plants.value?.plantsWithSetup.length)
)

const isLoading = computed(
    () => user.value === undefined || plants.value === undefined || setups.value === undefined
)

// #region watering
const isWateringLoading = ref<boolean[]>([])

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
// #endregion

// #region delete plant
const onDeletePlant = async () => {
    isPlantsDrawerVisible.value = false

    displayToast({
        severity: 'success',
        summary: 'Plant deleted.',
        life: 3000
    })

    invalidateSetupsQuery()
}
// #endregion

// #region area filter
const selectedArea = ref<string | null>(null)

const areaPlantsCount = computed<Record<string, number>>(() => {
    if (plants.value && setups.value) {
        const setupIdAreaMap = setups.value.reduce<Record<string, string>>((acc, { id, area }) => {
            acc[id] = area?.trim() ?? ''
            return acc
        }, {})

        const unassignedSetupPlants = plants.value.plantsWithSetup.filter(({ setup }) => {
            const area = setupIdAreaMap[setup.id]
            return !Boolean(area?.trim())
        })

        const unassignedSinglePlants = plants.value.singlePlants.filter(({ area }) => !area?.trim())

        const totalUnassignedPlants = unassignedSetupPlants.length + unassignedSinglePlants.length

        return {
            ...plants.value.areas,
            ...(totalUnassignedPlants && { Unassigned: totalUnassignedPlants })
        }
    }

    return {}
})

const filteredSetups = computed(() =>
    selectedArea.value
        ? setups.value?.filter(({ area }) => area?.trim() === selectedArea.value)
        : setups.value
)

const filteredSinglePlants = computed(() =>
    selectedArea.value
        ? plants.value?.singlePlants.filter(({ area }) => area?.trim() === selectedArea.value)
        : plants.value?.singlePlants
)

const toggleFilter = (area: string) => {
    selectedArea.value = selectedArea.value === area ? null : area
}
// #endregion
</script>

<style scoped>
.p-accordioncontent-content p {
    @apply text-sm;
}
</style>
