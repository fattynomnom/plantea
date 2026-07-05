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
                    :key="plant.id"
                    :initial-value="{
                        x: plant.position.x,
                        y: plant.position.y
                    }"
                    :container-element="imageRef"
                    class="absolute"
                    @end="position => (plant.position = position)"
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
            title="Plant details"
            @submit="onSubmitPlantDrawer"
        />
    </div>
</template>

<script setup lang="ts">
import { getColorFromIndex } from '@/utils/colors.utils'
import { UseDraggable } from '@vueuse/components'
import { computed, ref, useTemplateRef } from 'vue'
import PlantIndicator from './PlantIndicator.vue'
import CustomButton from './CustomButton.vue'
import { CalendarDaysIcon, TrashIcon } from '@heroicons/vue/24/outline'
import PlantsDrawer, { type PlantInput, type PlantOutput } from '@/components/PlantsDrawer.vue'
import dayjs from 'dayjs'
import { v4 } from 'uuid'

interface SetupImage {
    name?: string
    url: string
}

export interface PlantSetupFormData {
    id: string
    position: {
        x: number
        y: number
    }
    color: string
    name: string
    dates: Date[]
}

const { transitionName = 'slide-left', image } = defineProps<{
    transitionName?: 'slide-left' | 'slide-right'
    image?: SetupImage
}>()

const plants = defineModel<PlantSetupFormData[]>('plants', { required: true })

const imageRef = useTemplateRef('image')

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
            plants.value.push({ id: v4(), position: { x, y }, color, name: '', dates: [] })
        }
    }
}

const onSubmitPlantDrawer = (plant: PlantOutput) => {
    if (typeof selectedPlantIndex.value === 'number') {
        const plantData = plants.value[selectedPlantIndex.value]
        if (plantData) {
            plantData.name = plant.name
            plantData.dates = plant.dates
            isDrawerVisible.value = false
        }
    }
}
</script>
