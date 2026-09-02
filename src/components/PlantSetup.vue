<template>
    <div class="relative">
        <img
            ref="image"
            :alt="setup.imgName"
            :src="downloadUrl"
            width="346"
            height="432"
            class="w-full cursor-pointer rounded-2xl shadow-lg"
            @load="isImgLoaded = true"
        />

        <template v-if="isImgLoaded">
            <PencilSquareIcon
                class="absolute top-4 right-4 h-7 w-7 text-white"
                @click="$router.push(`/edit/${setup.id}`)"
            />

            <OnClickOutside
                v-for="(plant, plantIndex) in plants"
                :key="plant.name + plantIndex"
                :class="`absolute flex flex-col items-center space-y-5 plant-${plant.id}`"
                :style="{
                    ...plantPosition[plantIndex]
                }"
                :options="{
                    ignore: tooltipIgnoredEls[plantIndex]
                }"
                @trigger="onClickOutside(plantIndex)"
            >
                <div
                    :class="{
                        'relative rounded-full border border-white outline outline-offset-2 outline-white flex flex-col justify-center': true,
                        'overflow-hidden': plant.isWateredToday
                    }"
                    :style="{
                        height: `${INDICATOR_WIDTH_PX}px`,
                        width: `${INDICATOR_WIDTH_PX}px`
                    }"
                    @click="tooltipIndex = plantIndex"
                >
                    <template v-if="plant.isWateredToday">
                        <div class="plant-overlay top-0" />
                        <CheckIcon class="text-white h-8 w-8 m-auto" />
                    </template>

                    <div
                        v-else-if="plant.shouldBeWatered"
                        class="absolute bg-green-900 -bottom-2 -right-2 rounded-full"
                    >
                        <ExclamationCircleIcon class="text-white h-6 w-6" />
                    </div>
                </div>

                <Transition name="opacity">
                    <PlantCard
                        v-if="tooltipIndex === plantIndex"
                        class="absolute bg-color-default z-10"
                        :style="{
                            ...tooltipYPosition[plantIndex],
                            width: `${PLANT_CONTAINER_WIDTH_PX}px`
                        }"
                        :plant="plant"
                        :is-watering="tooltipIndex === plantIndex && isWatering"
                        @edit="$emit('edit', plant)"
                        @water="onCompleteWatering(plant)"
                    >
                        <h3>{{ plant.name }}</h3>
                    </PlantCard>
                </Transition>
            </OnClickOutside>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useDownloadUrlQuery } from '@/composables/useDownloadUrlQuery'
import { CheckIcon } from '@heroicons/vue/24/outline'
import { ExclamationCircleIcon, PencilSquareIcon } from '@heroicons/vue/24/solid'
import { OnClickOutside } from '@vueuse/components'
import { computed, ref, useTemplateRef, type CSSProperties } from 'vue'
import { markPlantWatered, type Plant } from '@/models/plant'
import { usePlantsQuery, type PlantWithSetup } from '@/composables/usePlantsQuery'
import { useToast } from '@/composables/useToast'
import type { Setup } from '@/models/setup'
import { calculatePosition } from '@/utils/chartValues.utils'
import type { ChartValues } from '@/types'
import { useElementSize } from '@vueuse/core'
import PlantCard from './PlantCard.vue'

const PLANT_CONTAINER_WIDTH_PX = 300
const PLANT_CONTAINER_HEIGHT_PX = 154
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
    plantCoordinates.value.map(position => {
        if (position) {
            const style: CSSProperties = {}

            // handle if indicator is too far right until it overflows
            const xEndPosition = position.x + INDICATOR_WIDTH_PX
            if (xEndPosition > imgDimensions.width.value) {
                style.right = `${INDICATOR_OFFSET_PX}px`
            } else {
                style.left = `${position.x}px`
            }

            // handle if indicator is too far up until it overflows
            const yStartPosition = position.y - INDICATOR_WIDTH_PX / 2
            if (yStartPosition < 0) {
                return {
                    ...style,
                    top: '0px'
                }
            }

            // handle if indicator is too far down until it overflows
            const yEndPosition = position.y + INDICATOR_WIDTH_PX / 2
            if (yEndPosition > imgDimensions.height.value) {
                return {
                    ...style,
                    bottom: '0px'
                }
            }

            return {
                ...style,
                top: `${position.y - INDICATOR_OFFSET_PX}px`
            }
        }

        return undefined
    })
)

const tooltipYPosition = computed<Array<CSSProperties | undefined>>(() =>
    plantCoordinates.value.map(position => {
        if (!position) {
            return undefined
        }

        const style: CSSProperties = {}

        // if tooltip overflows to the right
        if (position.x + PLANT_HALF_CONTAINER_WIDTH_PX > imgDimensions.width.value) {
            style.right = `-${INDICATOR_WIDTH_PX / 2}px`
        }

        if (position.x - PLANT_HALF_CONTAINER_WIDTH_PX < 0) {
            style.left = `-${position.x}px`
        }

        // if tooltip overflows below img
        const tooltipYStartPosition = position.y + INDICATOR_WIDTH_PX / 2 + INDICATOR_OFFSET_PX
        if (tooltipYStartPosition > imgDimensions.height.value) {
            style.top = `-${INDICATOR_WIDTH_PX + PLANT_CONTAINER_HEIGHT_PX}px`
        } else {
            style.top = `${INDICATOR_WIDTH_PX}px`
        }

        return style
    })
)

// #region display indicators when img is fully loaded
const isImgLoaded = ref(false)
// #endregion

// #region watering
const isWatering = ref(false)

const onCompleteWatering = async (plant: Plant) => {
    isWatering.value = true

    try {
        await markPlantWatered(plant)
        await invalidatePlantsQuery()
    } catch (error) {
        console.log('Error', error)
        displayGenericError()
    } finally {
        isWatering.value = false
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
