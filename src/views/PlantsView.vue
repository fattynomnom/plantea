<template>
    <main class="h-full space-y-7">
        <div class="space-y-3">
            <h2>Which plants have you watered today?</h2>

            <div v-if="isLoading" class="grid grid-cols-2 gap-3">
                <Skeleton v-for="index in 6" :key="`plant-skeleton-${index}`" class="!h-10" />
            </div>

            <ul v-else-if="hasPlants" class="grid grid-cols-2 gap-3">
                <li
                    v-for="plant in plants"
                    :key="plant.id"
                    :class="{
                        'px-4 py-2 bg-white shadow-lg rounded-2xl flex flex-col justify-center': true,
                        'opacity-50': plant.isWateredToday
                    }"
                    @click="onWaterPlantClick(plant)"
                >
                    <small class="text-xs uppercase font-bold">{{ plant.area }}</small>
                    <span> {{ plant.name }} {{ plant.isWateredToday ? '(WATERED)' : '' }} </span>
                </li>
            </ul>

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
                    v-for="plant in plants"
                    :key="`accordion-item-${plant.id}`"
                    :value="plant.id"
                >
                    <AccordionHeader>
                        <div class="flex flex-col space-y-1">
                            <small class="text-xs uppercase font-bold">{{ plant.area }}</small>
                            <span>{{ plant.name }}</span>
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
                                <h3>Last 5 watering times</h3>

                                <ul v-if="plant.datetimes.length">
                                    <li
                                        v-for="datetimes in plant.datetimes.slice(0, 5)"
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
                                        {{ plant.nextWateringDate?.format('DD/MM/YYYY') }} </strong
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PlantNotFoundCard from '@/components/PlantNotFoundCard.vue'
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
import { PencilSquareIcon, SparklesIcon } from '@heroicons/vue/24/outline'
import { useFirebaseUser } from '@/composables/useFirebaseUser'

const { user } = useFirebaseUser()

const { isPlantsDrawerVisible, editPlant } = usePlantsDrawer()

const { data: plants, invalidatePlantsQuery } = usePlantsQuery()

const { displayGenericError } = useToast()

const hasPlants = computed(() => Boolean(plants.value?.length))

const isLoading = computed(() => user.value === undefined || plants.value === undefined)

const isGenerating = ref(false)

const onWaterPlantClick = async (plant: Plant) => {
    try {
        await markPlantWatered(plant)
        await invalidatePlantsQuery()
    } catch (error) {
        console.log(Error, error)
        displayGenericError()
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
</script>

<style scoped>
.p-accordioncontent-content p {
    @apply text-sm;
}
</style>
