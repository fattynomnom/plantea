<template>
    <Drawer
        v-model:visible="visible"
        header="Add new plant setup"
        position="right"
        :class="{ dark: isDark }"
    >
        <div class="space-y-4">
            <Stepper :value="stepperValue" linear>
                <StepList>
                    <Step value="1">Upload plant setup</Step>
                    <Step value="2">Identify plants</Step>
                </StepList>
            </Stepper>

            <Transition :name="stepperValue === '1' ? 'slide-right' : 'slide-left'">
                <form v-if="stepperValue === '1'" class="space-y-7">
                    <ImageUpload
                        :initialFiles="formData.images.map(({ file }) => file)"
                        @update="onFilesUpdated"
                    />

                    <div class="flex flex-col space-y-2">
                        <label for="location-input"> Where is this setup located? </label>
                        <InputText
                            id="location-input"
                            type="text"
                            name="Location"
                            placeholder="Eg. Living room, Office"
                        />
                    </div>

                    <div class="flex justify-end">
                        <CustomButton @click="stepperValue = '2'">
                            <span>Next</span>
                            <ArrowRightCircleIcon />
                        </CustomButton>
                    </div>
                </form>

                <div v-else class="space-y-4">
                    <div class="flex space-x-2">
                        <label for="plant-setups">Identify plants</label>
                        <button
                            v-tooltip="'Tap on a plant in the image(s) to identify it.'"
                            class="pr-2"
                        >
                            <QuestionMarkCircleIcon class="h-5 w-5" />
                        </button>
                    </div>
                    <div id="plant-setups">
                        <div class="space-y-4">
                            <div
                                v-for="({ file, plants }, index) of formData.images"
                                :key="file.name + index"
                                class="border border-gray-700 rounded-2xl w-full overflow-hidden space-y-3"
                            >
                                <div class="relative">
                                    <img
                                        ref="images"
                                        :alt="file.name"
                                        :src="file.objectURL"
                                        width="200"
                                        height="200"
                                        class="w-full cursor-pointer"
                                        @click="onImgClick($event, index)"
                                    />
                                    <PlantIndicator
                                        v-for="(plant, plantIndex) in plants"
                                        :key="plant.name + plantIndex"
                                        :color="plant.color"
                                        class="absolute cursor-pointer hover:scale-150 transition"
                                        :style="{
                                            left: `${plant.position.x}px`,
                                            top: `${plant.position.y}px`
                                            // 'scale-150': plantRefs[index][plantIndex]
                                        }"
                                    />
                                </div>

                                <div class="p-3 grid grid-cols-2 gap-2">
                                    <IconField
                                        v-for="(plant, plantIndex) in plants"
                                        :key="plant.name + plantIndex + 'item'"
                                        :ref="
                                            el => {
                                                // const imgObj = plantRefs[index] ?? {}
                                                // const plantObj = imgObj[plantIndex] ?? {}
                                                plantRefs[index][plantIndex] = el
                                            }
                                        "
                                    >
                                        <InputIcon>
                                            <PlantIndicator :color="plant.color" />
                                        </InputIcon>
                                        <InputText
                                            size="small"
                                            type="text"
                                            v-model="plant.name"
                                            fluid
                                        />
                                    </IconField>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex pt-6 justify-between">
                        <Button
                            label="Back"
                            severity="secondary"
                            icon="pi pi-arrow-left"
                            @click="stepperValue = '1'"
                        />
                        <Button label="Next" icon="pi pi-arrow-right" iconPos="right" />
                    </div>
                </div>
            </Transition>
        </div>
    </Drawer>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ArrowRightCircleIcon, QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import Drawer from 'primevue/drawer'
import { nextTick, ref, useTemplateRef, type ShallowRef } from 'vue'
import { useDark } from '@vueuse/core'
import { Button, IconField, InputIcon, InputText, Step, StepList, Stepper } from 'primevue'
import ImageUpload from '@/components/ImageUpload.vue'
import PlantIndicator from '@/components/PlantIndicator.vue'

interface FormData {
    images: Array<{
        file: File
        plants: Array<{
            position: {
                x: number
                y: number
            }
            color: string
            name: string
        }>
    }>
}

const isDark = useDark()

const visible = defineModel<boolean>('visible', { required: true })
const stepperValue = ref('1')
const formData = ref<FormData>({ images: [] })

// #region file upload
const onFilesUpdated = (newFiles: File[]) => {
    formData.value.images = newFiles.map(selectedFile => {
        const existingFile = formData.value.images.find(
            ({ file }) =>
                file.name === selectedFile.name &&
                file.size === selectedFile.size &&
                file.type === selectedFile.type
        )

        return {
            file: selectedFile,
            plants: existingFile?.plants ?? []
        }
    })
}
// #endregion

// #region identifying plants in img
const colors = [
    'red',
    'orange',
    'amber',
    'lime',
    'green',
    'cyan',
    'blue',
    'indigo',
    'purple',
    'fuchsia',
    'pink',
    'rose'
]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Test = Readonly<ShallowRef<any>>
const imageRefs = useTemplateRef('images')
const plantRefs = ref<Record<number, Record<number, Test>>>({})

const onImgClick = (event: PointerEvent, imgIndex: number) => {
    const containerRect = imageRefs.value?.[imgIndex]?.getBoundingClientRect()
    if (containerRect) {
        const PLANT_INDICATOR_WIDTH = 14
        const halfWidth = PLANT_INDICATOR_WIDTH / 2
        const x = event.clientX - containerRect.left - halfWidth
        const y = event.clientY - containerRect.top - halfWidth

        const image = formData.value.images[imgIndex]
        const plantIndex = image.plants.length
        const colorIndex =
            plantIndex >= colors.length ? Math.floor(plantIndex / colors.length) - 1 : plantIndex

        image.plants.push({
            position: { x, y },
            name: `Plant ${plantIndex}`,
            color: colors[colorIndex < 0 ? 0 : colorIndex]
        })
    }

    nextTick(() => {
        console.log(plantRefs.value)
    })
}
// #endregion
</script>
