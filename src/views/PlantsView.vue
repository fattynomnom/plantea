<template>
    <main class="h-full w-full space-y-5 px-7 pb-7 overflow-y-scroll overflow-x-hidden">
        <div class="flex space-x-2">
            <template v-if="isLoading">
                <Skeleton
                    v-for="index in 2"
                    :key="`stats-skeleton-${index}`"
                    class="flex-1 !h-20"
                />
            </template>

            <template v-else>
                <div class="stats-card">
                    <h3>Total plants watered today</h3>
                    <p>{{ wateredPlantsCount }}</p>
                </div>
                <div class="stats-card">
                    <h3>Total thirsty plants today</h3>
                    <p>{{ thirstyPlantsCount }}</p>
                </div>
            </template>
        </div>

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
                        'py-2 px-3 bg-white rounded-2xl text-xs uppercase tracking-wide font-accent font-semibold': true,
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
import { usePlantsQuery, type PlantWithSetup } from '@/composables/usePlantsQuery'
import { Skeleton } from 'primevue'
import { useToast } from '@/composables/useToast'
import { usePlantsDrawer } from '@/composables/usePlantsDrawer'
import CustomButton from '@/components/CustomButton.vue'
import { useFirebaseUser } from '@/composables/useFirebaseUser'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import PlantSetup from '@/components/PlantSetup.vue'
import PlantsDrawer from '@/components/PlantsDrawer.vue'
import PlantCard from '@/components/PlantCard.vue'
import { useAreas } from '@/composables/useAreas'

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

const { areaPlantsCountMap } = useAreas()

const { displayGenericError, displayToast } = useToast()

const hasPlants = computed(() =>
    Boolean(plants.value?.singlePlants.length || plants.value?.plantsWithSetup.length)
)

const isLoading = computed(
    () => user.value === undefined || plants.value === undefined || setups.value === undefined
)

// #region stats
const allPlants = computed(() => [
    ...(plants.value?.plantsWithSetup ?? []),
    ...(plants.value?.singlePlants ?? [])
])

const wateredPlantsCount = computed<number>(() =>
    allPlants.value.reduce<number>((acc, { isWateredToday }) => (isWateredToday ? acc + 1 : acc), 0)
)

const thirstyPlantsCount = computed<number>(() =>
    allPlants.value.reduce<number>(
        (acc, { shouldBeWatered }) => (shouldBeWatered ? acc + 1 : acc),
        0
    )
)
// #endregion

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

const unassignedSinglePlants = computed(
    () => plants.value?.singlePlants.filter(({ area }) => !area?.trim()) ?? []
)

const unassignedSetups = computed(() => setups.value?.filter(({ area }) => !area?.trim()) ?? [])

const areaPlantsCount = computed<Record<string, number>>(() => {
    const unassignedSetupPlants = unassignedSetups.value.reduce<PlantWithSetup[]>(
        (acc, { plants }) => acc.concat(plants),
        []
    )

    const totalUnassignedPlants = unassignedSetupPlants.length + unassignedSinglePlants.value.length

    return {
        ...areaPlantsCountMap.value,
        ...(totalUnassignedPlants && { Unassigned: totalUnassignedPlants })
    }
})

const filteredSetups = computed(() => {
    if (selectedArea.value === 'Unassigned') {
        return unassignedSetups.value
    }

    return selectedArea.value
        ? setups.value?.filter(({ area }) => area?.trim() === selectedArea.value)
        : setups.value
})

const filteredSinglePlants = computed(() => {
    if (selectedArea.value === 'Unassigned') {
        return unassignedSinglePlants.value
    }

    return selectedArea.value
        ? plants.value?.singlePlants.filter(({ area }) => area?.trim() === selectedArea.value)
        : plants.value?.singlePlants
})

const toggleFilter = (area: string) => {
    selectedArea.value = selectedArea.value === area ? null : area
}
// #endregion
</script>

<style scoped>
.p-accordioncontent-content p {
    @apply text-sm;
}

.stats-card {
    font-family: var(--font-accent);
    @apply flex-1 rounded-2xl space-y-2 bg-white p-4;
}

.stats-card h3 {
    @apply leading-5 text-sm;
}

.stats-card p {
    @apply tracking-wide font-semibold text-2xl;
}
</style>
