<template>
    <main class="h-full space-y-5">
        <div class="space-y-3">
            <h2>Which plants have you watered today?</h2>

            <ul v-if="hasPlants" class="grid grid-cols-2 gap-3">
                <li
                    v-for="plant in plants"
                    :key="plant.id"
                    :class="{
                        'px-4 py-2 bg-white shadow-lg rounded-2xl': true,
                        'opacity-50': isPlantWateredToday(plant)
                    }"
                    @click="onWaterPlantClick(plant)"
                >
                    {{ plant.name }} {{ isPlantWateredToday(plant) ? '(WATERED)' : '' }}
                </li>
            </ul>

            <PlantNotFoundCard v-else @add-plant="isDrawerVisible = true" />
        </div>

        <div class="space-y-3">
            <h2>All plants history</h2>

            <Accordion v-if="hasPlants" value="0">
                <AccordionPanel
                    v-for="plant in plants"
                    :key="`accordion-item-${plant.id}`"
                    :value="plant.id"
                >
                    <AccordionHeader>{{ plant.name }}</AccordionHeader>
                    <AccordionContent>
                        <div class="space-y-4">
                            <div class="space-y-3">
                                <h3>Last 5 watering times</h3>

                                <ul>
                                    <li
                                        v-for="datetimes in plant.datetimes.slice(0, 5)"
                                        :key="`${plant.id}-${datetimes}`"
                                        class="tracking-wider"
                                    >
                                        {{ dayjs(datetimes).format('DD/MM/YYYY') }}
                                    </li>
                                </ul>
                            </div>

                            <div class="space-y-3">
                                <h3>Recommendation</h3>
                                <p>
                                    Water every <strong>7 days</strong>.
                                    <br />
                                    Next watering at <strong>06/07/2026</strong>.
                                </p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>

            <PlantNotFoundCard v-else @add-plant="isDrawerVisible = true" />
        </div>
    </main>

    <!-- <AddPlantsDrawer v-model:visible="isDrawerVisible" @submitted="fetchData" /> -->
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PlantNotFoundCard from '@/components/PlantNotFoundCard.vue'
import { markPlantWatered, isPlantWateredToday, type Plant } from '@/models/plant'
import { plantsQueryKey, usePlantsQuery } from '@/composables/usePlantsQuery'
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primevue'
import dayjs from 'dayjs'
import { useToast } from '@/composables/useToast'
import { useQueryClient } from '@tanstack/vue-query'

const isDrawerVisible = ref(false)

const { data: plants } = usePlantsQuery()

const queryClient = useQueryClient()

const { displayGenericError } = useToast()

const hasPlants = computed(() => Boolean(plants.value?.length))

const onWaterPlantClick = async (plant: Plant) => {
    try {
        await markPlantWatered(plant)
        await queryClient.invalidateQueries({ queryKey: plantsQueryKey })
    } catch {
        displayGenericError()
    }
}
</script>
