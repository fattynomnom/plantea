<template>
    <div>
        <Transition :name="transitionName">
            <div v-if="image" class="relative">
                <img
                    ref="image"
                    :alt="image.name"
                    :src="image.url"
                    width="200"
                    height="200"
                    class="w-full cursor-pointer rounded-2xl"
                    @click="onImgClick($event)"
                />

                <UseDraggable
                    v-for="(plant, plantIndex) in plants"
                    :key="`${plant.id}-${positionsRenderKey}`"
                    :initial-value="positions[plantIndex]"
                    :container-element="imageRef"
                    class="absolute"
                    @end="position => setPositionPercentage(position, plantIndex)"
                >
                    <PlantIndicator
                        :color="plant.color"
                        class="cursor-pointer hover:scale-150 transition ease-in-out duration-300"
                        :style="{
                            transform: `scale(${selectedIndicatorIndex === plantIndex ? 2.5 : 1})`
                        }"
                    />
                </UseDraggable>
            </div>
        </Transition>

        <div class="py-4 space-y-3">
            <TransitionGroup name="instant-slide-left">
                <div
                    v-for="(plant, plantIndex) in plants"
                    :key="`plant-input-${plantIndex}`"
                    class="flex space-x-3 items-center"
                >
                    <div class="flex-1 flex space-x-2 items-center">
                        <PlantIndicator :color="plant.color" />
                        <input
                            :id="`plant-${plantIndex}`"
                            :placeholder="`Plant ${plantIndex + 1}`"
                            v-model.trim="plant.name"
                            type="text"
                            name="Name"
                            autocomplete="off"
                            data-size="small"
                            class="p-inputtext w-full"
                            @focus="selectedIndicatorIndex = plantIndex"
                        />
                    </div>

                    <CustomButton variant="link" @click="selectedPlantIndex = plantIndex">
                        <CalendarDaysIcon />
                    </CustomButton>

                    <CustomButton variant="link" @click="plants.splice(plantIndex, 1)">
                        <TrashIcon />
                    </CustomButton>
                </div>
            </TransitionGroup>
        </div>

        <PlantsDrawer
            v-model:visible="isDrawerVisible"
            :initial-value="selectedPlant"
            :allow-area="false"
            :allow-delete="false"
            title="Plant details"
            @submit="onSubmitPlantDrawer"
        />
    </div>
</template>

<script setup lang="ts">
import { getColorFromIndex } from '@/utils/colors.utils'
import { UseDraggable } from '@vueuse/components'
import { computed, ref, useTemplateRef, watch } from 'vue'
import PlantIndicator from './PlantIndicator.vue'
import CustomButton from './CustomButton.vue'
import { CalendarDaysIcon, TrashIcon } from '@heroicons/vue/24/outline'
import PlantsDrawer, { type PlantInput, type PlantOutput } from '@/components/PlantsDrawer.vue'
import dayjs from 'dayjs'
import type { ChartValues } from '@/types'
import { calculatePosition } from '@/utils/chartValues.utils'
import { useElementSize } from '@vueuse/core'

interface SetupImage {
    name?: string
    url: string
}

export interface PlantSetupDetailsFormData {
    id: string
    positionPercentage: ChartValues
    color: string
    name: string
    dates: Date[]
    frequencyDays?: number
}

export type PlantSetupDetailsFormAddEmitterValue = Pick<
    PlantSetupDetailsFormData,
    'positionPercentage' | 'color'
>

const { transitionName = 'slide-left', image } = defineProps<{
    transitionName?: 'slide-left' | 'slide-right'
    image?: SetupImage
}>()

const emit = defineEmits<{
    (e: 'add', value: PlantSetupDetailsFormAddEmitterValue): Promise<void>
}>()

const plants = defineModel<PlantSetupDetailsFormData[]>('plants', { required: true })

const selectedIndicatorIndex = ref<number>()
const selectedPlantIndex = ref<number>()

const selectedPlant = computed<PlantInput | undefined>(() => {
    const plant =
        typeof selectedPlantIndex.value === 'number'
            ? plants.value[selectedPlantIndex.value]
            : undefined

    return plant
        ? {
              name: plant.name,
              dates: plant.dates.length
                  ? plant.dates.map(date => dayjs(date).format('DD/MM/YYYY'))
                  : [null]
          }
        : undefined
})

const isDrawerVisible = computed<boolean>({
    get: () => typeof selectedPlantIndex.value === 'number',
    set: value => {
        if (!value) {
            selectedPlantIndex.value = undefined
        }
    }
})

// #region positioning
const positionsRenderKey = ref(0)

const imageRef = useTemplateRef('image')

const imgDimensions = useElementSize(imageRef)

const positions = computed<Array<ChartValues | undefined>>(() =>
    plants.value.map(({ positionPercentage }) => calculatePlantPosition(positionPercentage))
)

const calculatePlantPosition = (positionPercentage: ChartValues): ChartValues | undefined =>
    calculatePosition(positionPercentage, {
        width: imgDimensions.width.value,
        height: imgDimensions.height.value
    })

const calculatePositionPercentage = ({ x, y }: ChartValues) => {
    const { width, height } = imgDimensions
    if (width.value && height.value) {
        return {
            x: (x / width.value) * 100,
            y: (y / height.value) * 100
        }
    }

    return undefined
}

const setPositionPercentage = (position: ChartValues, plantIndex: number) => {
    const plant = plants.value[plantIndex]
    if (plant) {
        const positionPercentage = calculatePositionPercentage(position)
        if (positionPercentage) {
            plant.positionPercentage = positionPercentage
        }
    }
}

const onImgClick = (event: PointerEvent) => {
    const imgPosition = imageRef.value?.getBoundingClientRect()
    if (!imgPosition) {
        return
    }

    const PLANT_INDICATOR_WIDTH = 14
    const halfWidth = PLANT_INDICATOR_WIDTH / 2
    const x = event.clientX - imgPosition.left - halfWidth
    const y = event.clientY - imgPosition.top - halfWidth

    const plantIndex = plants.value.length

    if (typeof plantIndex === 'number') {
        const color = getColorFromIndex(plantIndex)
        if (color) {
            const positionPercentage = calculatePositionPercentage({ x, y })
            if (positionPercentage) {
                emit('add', { positionPercentage, color })
            }
        }
    }
}

watch(positions, () => {
    positionsRenderKey.value += 1
})
// #endregion

// #region submission
const onSubmitPlantDrawer = (plant: PlantOutput) => {
    if (typeof selectedPlantIndex.value === 'number') {
        const plantData = plants.value[selectedPlantIndex.value]
        if (plantData) {
            plantData.name = plant.name
            plantData.dates = plant.dates
            plantData.frequencyDays = plant.frequencyDays
            isDrawerVisible.value = false
        }
    }
}
// #endregion
</script>
