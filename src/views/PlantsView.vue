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
                    :image-name="setup.imgName"
                    :plants="setup.plants"
                />

                <PlantCardList
                    :plants="plants?.singlePlants"
                    :is-loading="isWateringLoading"
                    @click="onWaterPlantClick"
                />
            </template>

            <PlantNotFoundCard v-else @add-plant="isPlantsDrawerVisible = true" />
        </div>

        <div
            :class="{
                'space-y-3': true,
                'pb-10': hasPlants
            }"
        >
            <h2>All plants history</h2>

            <div v-if="isLoading" class="space-y-3">
                <Skeleton v-for="index in 3" :key="`accordion-skeleton-${index}`" class="!h-7" />
            </div>

            <Accordion v-else-if="hasPlants" value="0" lazy>
                <AccordionPanel
                    v-for="plant in plants?.singlePlants"
                    :key="`accordion-item-${plant.id}`"
                    :value="plant.id"
                >
                    <AccordionHeader>
                        <div class="flex-1 flex items-center justify-between pr-3">
                            <div class="flex flex-col space-y-1">
                                <small class="text-xs uppercase font-bold">{{ plant.area }}</small>
                                <span>{{ plant.name }}</span>
                            </div>
                            <ExclamationCircleIcon
                                v-if="plant.shouldBeWatered"
                                class="flex-shrink-0 w-5 h-5 color-danger"
                            />
                        </div>
                    </AccordionHeader>
                    <AccordionContent>
                        <div class="relative">
                            <div class="absolute top-0 right-0 flex items-center space-x-2">
                                <CustomButton variant="link" @click="editPlant(plant)">
                                    <PencilSquareIcon />
                                </CustomButton>
                                <CustomButton
                                    variant="link"
                                    :is-loading="isGenerating"
                                    @click="onGenerateClick(plant)"
                                >
                                    <SparklesIcon />
                                </CustomButton>
                            </div>

                            <div class="space-y-1">
                                <h3>Logged watering times</h3>

                                <ul v-if="plant.datetimes.length" class="grid grid-cols-2">
                                    <li
                                        v-for="datetimes in plant.datetimes.slice(0, 10)"
                                        :key="`${plant.id}-${datetimes}`"
                                        class="tracking-wider text-sm"
                                    >
                                        {{ dayjs(datetimes).format('DD/MM/YYYY') }}
                                    </li>
                                </ul>

                                <p v-else>No data recorded.</p>
                            </div>

                            <div class="space-y-1 mt-4">
                                <h3>Recommendation</h3>
                                <p v-if="isGenerating">Generating...</p>
                                <p v-else-if="typeof plant.frequencyDays === 'number'">
                                    Water every <strong>{{ plant.frequencyDays }} days</strong>.
                                    <br />
                                    Next watering at
                                    <strong>
                                        {{
                                            plant.nextWateringDate
                                                ? dayjs(plant.nextWateringDate).format('DD/MM/YYYY')
                                                : '-'
                                        }} </strong
                                    >.
                                </p>
                                <p v-else>No recommendation generated yet.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>

            <PlantNotFoundCard v-else @add-plant="isPlantsDrawerVisible = true" />
        </div>
    </main>

    <PredictionDrawer v-model:visible="isPredictionOpen" />

    <PlantsDrawer
        v-model:visible="isPlantsDrawerVisible"
        v-model="plant"
        :original-datetimes="originalDatetimes"
        :title="plant.id ? 'Edit plant' : 'Add new plant'"
        @reset="resetPlant"
    />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PlantNotFoundCard from '@/components/PlantNotFoundCard.vue'
import PlantCardList from '@/components/PlantCardList.vue'
import {
    markPlantWatered,
    type Plant,
    genPlantAnalysis,
    updatePlant,
    type UpdatePlantInput
} from '@/models/plant'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel, Skeleton } from 'primevue'
import dayjs from 'dayjs'
import { useToast } from '@/composables/useToast'
import { usePlantsDrawer } from '@/composables/usePlantsDrawer'
import CustomButton from '@/components/CustomButton.vue'
import {
    ExclamationCircleIcon,
    PencilSquareIcon,
    SparklesIcon,
    PlusIcon
} from '@heroicons/vue/24/outline'
import { useFirebaseUser } from '@/composables/useFirebaseUser'
import PredictionDrawer from '@/components/PredictionDrawer.vue'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import PlantSetup from '@/components/PlantSetup.vue'
import PlantsDrawer from '@/components/PlantsDrawer.vue'

const { user } = useFirebaseUser()

const { isPlantsDrawerVisible, plant, originalDatetimes, resetPlant, editPlant } = usePlantsDrawer()

const { data: plants, invalidatePlantsQuery } = usePlantsQuery()

const { data: setups } = useSetupsQuery()

const { displayGenericError } = useToast()

const hasPlants = computed(() =>
    Boolean(plants.value?.singlePlants.length || plants.value?.plantsWithSetup.length)
)

const isLoading = computed(
    () => user.value === undefined || plants.value === undefined || setups.value === undefined
)

const isGenerating = ref(false)
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

const onGenerateClick = async (plant: UpdatePlantInput) => {
    isGenerating.value = true

    try {
        const frequencyDays = await genPlantAnalysis(plant)

        // only update if generated recommendation is different from existing recommendation
        if (frequencyDays !== plant.frequencyDays) {
            await updatePlant({
                ...plant,
                frequencyDays
            })
            await invalidatePlantsQuery()
        }
    } catch {
        displayGenericError()
    } finally {
        isGenerating.value = false
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
