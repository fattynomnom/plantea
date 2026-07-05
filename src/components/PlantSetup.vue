<template>
    <div class="relative">
        <img
            ref="image"
            :alt="setup.imgName"
            :src="downloadUrl"
            width="200"
            height="200"
            class="w-full cursor-pointer rounded-2xl shadow-lg"
        />

        <PencilSquareIcon
            class="absolute top-4 right-4 h-7 w-7 text-white"
            @click="$router.push(`/edit/${setup.id}`)"
        />

        <OnLongPress
            v-for="(plant, plantIndex) in plants"
            :key="plant.name + plantIndex"
            as="div"
            :class="{
                'absolute rounded-full border border-white outline outline-offset-2 outline-white h-[50px] w-[50px] flex flex-col justify-center': true,
                'overflow-hidden': plant.isWateredToday || wateringHeightPx > 0
            }"
            :style="{
                left: `${plant.setup.position.x - 25}px`,
                top: `${plant.setup.position.y - 25}px`
            }"
            :options="{ delay: 2000 }"
            @touchstart="onStartWatering(plant.id)"
            @touchend="resetWatering"
            @trigger="onCompleteWatering(plant)"
        >
            <template
                v-if="selectedPlantId === plant.id && wateringHeightPx > 0 && !plant.isWateredToday"
            >
                <div class="plant-overlay" :style="{ height: `${wateringHeightPx}px` }" />
                <div class="flex flex-col justify-center">
                    <CustomSpinner class="mx-auto text-white h-5 w-5" />
                </div>
            </template>

            <template v-else-if="plant.isWateredToday">
                <div class="plant-overlay top-0" />
                <CheckIcon class="text-white h-8 w-8 m-auto" />
            </template>

            <div
                v-else-if="plant.shouldBeWatered"
                class="absolute bg-green-900 -bottom-2 -right-2 rounded-full"
            >
                <ExclamationCircleIcon class="text-white h-6 w-6" />
            </div>
        </OnLongPress>
    </div>
</template>

<script setup lang="ts">
import { useDownloadUrlQuery } from '@/composables/useDownloadUrlQuery'
import { CheckIcon } from '@heroicons/vue/24/outline'
import { ExclamationCircleIcon, PencilSquareIcon } from '@heroicons/vue/24/solid'
import { OnLongPress } from '@vueuse/components'
import { ref } from 'vue'
import CustomSpinner from '@/components/CustomSpinner.vue'
import { markPlantWatered, type Plant } from '@/models/plant'
import { usePlantsQuery, type PlantWithSetup } from '@/composables/usePlantsQuery'
import { useToast } from '@/composables/useToast'
import type { Setup } from '@/models/setup'

const { setup, plants } = defineProps<{
    setup: Setup
    plants: PlantWithSetup[]
}>()

const { data: downloadUrl } = useDownloadUrlQuery(setup.imgName)

const { invalidatePlantsQuery } = usePlantsQuery()

const { displayGenericError } = useToast()

// #region watering
const selectedPlantId = ref<string>()
const wateringIntervalId = ref<NodeJS.Timeout>()
const wateringHeightPx = ref(0)

const resetWatering = () => {
    clearInterval(wateringIntervalId.value)
    wateringIntervalId.value = undefined
    selectedPlantId.value = undefined
    wateringHeightPx.value = 0
}

const onStartWatering = (plantId: PlantWithSetup['id']) => {
    selectedPlantId.value = plantId
    wateringHeightPx.value = 0
    wateringIntervalId.value = setInterval(() => {
        wateringHeightPx.value += 1.25
    }, 50)
}

const onCompleteWatering = async (plant: Plant) => {
    try {
        await markPlantWatered(plant)
        await invalidatePlantsQuery()
    } catch (error) {
        console.log('Error', error)
        displayGenericError()
    }
}
// #endregion
</script>

<style scoped>
.plant-overlay {
    @apply bg-white absolute left-0 right-0 bottom-0 opacity-30;
}
</style>
