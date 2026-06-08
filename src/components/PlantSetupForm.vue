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
                    :key="plant.name + plantIndex"
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

                    <CustomButton variant="link" @click="$emit('click-calendar', plantIndex)">
                        <CalendarDaysIcon />
                    </CustomButton>

                    <CustomButton variant="link" @click="$emit('click-trash', plantIndex)">
                        <TrashIcon />
                    </CustomButton>
                </div>
            </TransitionGroup>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getColorFromIndex } from '@/utils/colors.utils'
import { UseDraggable } from '@vueuse/components'
import { ref, useTemplateRef } from 'vue'
import PlantIndicator from './PlantIndicator.vue'
import CustomButton from './CustomButton.vue'
import { CalendarDaysIcon, TrashIcon } from '@heroicons/vue/24/outline'

interface SetupImage {
    name: string
    url: string
}

interface Plant {
    position: {
        x: number
        y: number
    }
    color: string
    name: string
}

const { transitionName, image, plants } = defineProps<{
    transitionName: 'slide-left' | 'slide-right'
    image?: SetupImage
    plants?: Plant[]
}>()

const emit = defineEmits<{
    (e: 'click-indicator', data: Pick<Plant, 'position' | 'color'>): void
    (e: 'click-calendar', plantIndex: number): void
    (e: 'click-trash', plantIndex: number): void
}>()

const imageRef = useTemplateRef('image')

const selectedIndicatorIndex = ref<number>()

const onImgClick = (event: PointerEvent) => {
    const imgPosition = imageRef.value?.getBoundingClientRect()
    if (!imgPosition) {
        return
    }

    const PLANT_INDICATOR_WIDTH = 14
    const halfWidth = PLANT_INDICATOR_WIDTH / 2
    const x = event.clientX - imgPosition.left - halfWidth
    const y = event.clientY - imgPosition.top - halfWidth

    const plantIndex = plants?.length

    if (typeof plantIndex === 'number') {
        const color = getColorFromIndex(plantIndex)
        if (color) {
            emit('click-indicator', { position: { x, y }, color })
        }
    }
}
</script>
