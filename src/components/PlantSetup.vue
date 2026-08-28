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

        <OnClickOutside
            v-for="(plant, plantIndex) in plants"
            :key="plant.name + plantIndex"
            :class="`absolute flex flex-col items-center space-y-5 plant-${plant.id}`"
            :style="{
                ...plantPosition[plantIndex],
                width: `${PLANT_CONTAINER_WIDTH_PX}px`
            }"
            :options="{
                ignore: tooltipIgnoredEls[plantIndex]
            }"
            @trigger="onClickOutside(plantIndex)"
        >
            <OnLongPress
                as="div"
                :class="{
                    'relative rounded-full border border-white outline outline-offset-2 outline-white flex flex-col justify-center': true,
                    'overflow-hidden': plant.isWateredToday || wateringHeightPx > 0
                }"
                :style="{
                    height: `${INDICATOR_WIDTH_PX}px`,
                    width: `${INDICATOR_WIDTH_PX}px`
                }"
                :options="{ delay: 2000 }"
                @touchstart="onStartWatering(plant.id)"
                @touchend="resetWatering(plantIndex)"
                @trigger="onCompleteWatering(plant)"
            >
                <template
                    v-if="
                        selectedPlantId === plant.id &&
                        wateringHeightPx > 0 &&
                        !plant.isWateredToday
                    "
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

            <Transition name="opacity">
                <div
                    v-if="tooltipIndex === plantIndex"
                    class="absolute rounded-2xl py-3 px-4 bg-color-default"
                    :style="{
                        ...tooltipYPosition[plantIndex],
                        width: `${PLANT_CONTAINER_WIDTH_PX}px`,
                        top: `${INDICATOR_WIDTH_PX}px`
                    }"
                >
                    <div class="flex flex-wrap gap-2 mb-3">
                        <Chip
                            v-if="plant.frequencyDays"
                            :label="`Every ${plant.frequencyDays} days`"
                            data-color="sky"
                        >
                            <template #icon>
                                <WaterDropletIcon />
                            </template>
                        </Chip>
                        <Chip v-if="plant.isWateredToday" label="Watered" data-color="green">
                            <template #icon>
                                <CheckCircleIcon />
                            </template>
                        </Chip>
                        <Chip
                            v-else-if="plant.shouldBeWatered"
                            label="Water today"
                            data-color="red"
                        >
                            <template #icon>
                                <ExclamationCircleIcon />
                            </template>
                        </Chip>
                        <Chip
                            v-else-if="plant.frequencyDays"
                            :label="`Next ${dayjs(plant.nextWateringDate).diff(undefined, 'days')} day`"
                            data-color="gray"
                        >
                            <template #icon>
                                <FaucetIcon />
                            </template>
                        </Chip>
                    </div>

                    <div class="mb-4">
                        <h3>{{ plant.name }} logs</h3>
                        <ul v-if="plant.datetimes.length" class="grid grid-cols-2">
                            <li
                                v-for="datetimes in plant.datetimes.slice(0, 10)"
                                :key="`${plant.id}-${datetimes}`"
                                class="tracking-wider text-sm"
                            >
                                {{ dayjs(datetimes).format('DD/MM/YYYY') }}
                            </li>
                        </ul>
                        <div v-else class="text-sm">No data recorded.</div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <CustomButton variant="outline" @click="$emit('edit', plant)">
                            Edit
                        </CustomButton>
                        <CustomButton
                            :is-disabled="plant.isWateredToday"
                            @click="onCompleteWatering(plant)"
                        >
                            Water
                        </CustomButton>
                    </div>
                </div>
            </Transition>
        </OnClickOutside>
    </div>
</template>

<script setup lang="ts">
import { useDownloadUrlQuery } from '@/composables/useDownloadUrlQuery'
import { CheckIcon } from '@heroicons/vue/24/outline'
import { CheckCircleIcon, ExclamationCircleIcon, PencilSquareIcon } from '@heroicons/vue/24/solid'
import { OnLongPress, OnClickOutside } from '@vueuse/components'
import { computed, ref, useTemplateRef, type CSSProperties } from 'vue'
import CustomSpinner from '@/components/CustomSpinner.vue'
import { markPlantWatered, type Plant } from '@/models/plant'
import { usePlantsQuery, type PlantWithSetup } from '@/composables/usePlantsQuery'
import { useToast } from '@/composables/useToast'
import type { Setup } from '@/models/setup'
import { calculatePosition } from '@/utils/chartValues.utils'
import type { ChartValues } from '@/types'
import { useElementSize } from '@vueuse/core'
import { Chip } from 'primevue'
import WaterDropletIcon from '@/assets/icons/water-droplet.svg?component'
import FaucetIcon from '@/assets/icons/faucet-drip.svg?component'
import dayjs from 'dayjs'
import CustomButton from './CustomButton.vue'

const PLANT_CONTAINER_WIDTH_PX = 300
const PLANT_HALF_CONTAINER_WIDTH_PX = PLANT_CONTAINER_WIDTH_PX / 2
const INDICATOR_WIDTH_PX = 50
const INDICATOR_OFFSET_PX = 20

const { setup, plants } = defineProps<{
    setup: Setup
    plants: PlantWithSetup[]
}>()

defineEmits<{
    (e: 'edit', value: PlantWithSetup): Promise<void>
}>()

const { data: downloadUrl } = useDownloadUrlQuery(setup.imgName)

const { invalidatePlantsQuery } = usePlantsQuery()

const { displayGenericError } = useToast()

const imageRef = useTemplateRef('image')
const imgDimensions = useElementSize(imageRef)

const plantCoordinates = computed<Array<ChartValues | undefined>>(() =>
    plants.map(({ setup: { positionPercentage } }) =>
        calculatePosition(positionPercentage, {
            width: imgDimensions.width.value,
            height: imgDimensions.height.value
        })
    )
)

const plantPosition = computed<Array<CSSProperties | undefined>>(() =>
    plantCoordinates.value.map(position =>
        position
            ? {
                  left: `${position.x - PLANT_HALF_CONTAINER_WIDTH_PX}px`,
                  top: `${position.y - INDICATOR_OFFSET_PX}px`
              }
            : undefined
    )
)

const tooltipYPosition = computed<Array<CSSProperties | undefined>>(() =>
    plantCoordinates.value.map(position => {
        if (!position) {
            return undefined
        }

        if (position.x + PLANT_HALF_CONTAINER_WIDTH_PX > imgDimensions.width.value) {
            const overflow = position.x + PLANT_HALF_CONTAINER_WIDTH_PX - imgDimensions.width.value

            return { left: `-${overflow}px` }
        }

        if (position.x - PLANT_HALF_CONTAINER_WIDTH_PX < 0) {
            const overflow = -(
                position.x -
                PLANT_HALF_CONTAINER_WIDTH_PX -
                (imageRef.value?.clientLeft ?? 0)
            )

            return { left: `${overflow}px` }
        }

        return {}
    })
)

// #region watering
const selectedPlantId = ref<string>()
const wateringIntervalId = ref<NodeJS.Timeout>()
const wateringHeightPx = ref(0)

const resetWatering = (index: number) => {
    // reset watering
    clearInterval(wateringIntervalId.value)
    wateringIntervalId.value = undefined
    selectedPlantId.value = undefined
    wateringHeightPx.value = 0

    // trigger tooltip
    tooltipIndex.value = index
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

// #region tooltip
const tooltipIndex = ref<number>()

const tooltipIgnoredEls = computed<string[][]>(() =>
    plants.map(({ id }) => {
        const otherPlants = plants
            .filter(otherPlant => otherPlant.id != id)
            .map(({ id }) => `plant-${id}`)
        return otherPlants
    })
)

const onClickOutside = (index: number) => {
    if (index === tooltipIndex.value) {
        tooltipIndex.value = undefined
    }
}
// #endregion
</script>

<style scoped>
.plant-overlay {
    @apply bg-white absolute left-0 right-0 bottom-0 opacity-30;
}
</style>
