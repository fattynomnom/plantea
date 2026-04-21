<template>
    <div class="space-y-4 flex flex-col flex-1 overflow-y-hidden">
        <Transition :name="stepperValue === '1' ? 'slide-right' : 'slide-left'">
            <div v-if="stepperValue === '1'" class="flex-1 space-y-4 px-7 pb-7">
                <h2>Upload plants setup</h2>

                <ImageUpload
                    :initialFiles="formData.images.map(({ file }) => file)"
                    @update="onFilesUpdated"
                />

                <div class="flex flex-col space-y-2 mt-3">
                    <label for="location-input">Where is this setup located? (Optional)</label>
                    <AreaAutocomplete
                        v-model="formData.area"
                        placeholder="Eg. Living room, Office"
                    />
                </div>
            </div>

            <div
                v-else
                class="flex-1 space-y-4 flex flex-col overflow-y-scroll overflow-x-hidden px-7 pb-7"
            >
                <div class="space-y-1">
                    <h2>Identify plants</h2>
                    <div>
                        <small>
                            Tap on a plant in the image(s) to identify it. Hold and drag the
                            indicator to move if needed.
                        </small>
                    </div>
                </div>

                <FilesList
                    v-if="formData.images.length > 1"
                    :files="formData.images.map(({ file }) => file)"
                    size="small"
                    :selectedIndex="selectedImgIndex"
                    @remove="index => formData.images.splice(index, 1)"
                    @click="onFileClick"
                />

                <div class="flex-1">
                    <Transition :name="isNextClicked ? 'slide-left' : 'slide-right'">
                        <div v-if="selectedImg" class="relative">
                            <img
                                ref="image"
                                :alt="selectedImg.file.name"
                                :src="selectedImg.file.objectURL"
                                width="200"
                                height="200"
                                class="w-full cursor-pointer rounded-2xl"
                                @click="onImgClick($event)"
                            />

                            <UseDraggable
                                v-for="(plant, plantIndex) in selectedImg.plants"
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

                    <div v-if="selectedImg" class="py-4 space-y-3">
                        <TransitionGroup name="instant-slide-left">
                            <div
                                v-for="(plant, plantIndex) in selectedImg.plants"
                                :key="`${plant.position.x}-${plant.position.y}-${plantIndex}`"
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

                                <CustomButton
                                    variant="link"
                                    @click="
                                        selectedPlant = {
                                            name: plant.name,
                                            dates: [null]
                                        }
                                    "
                                >
                                    <CalendarDaysIcon />
                                </CustomButton>

                                <CustomButton variant="link">
                                    <TrashIcon />
                                </CustomButton>
                            </div>
                        </TransitionGroup>
                    </div>
                </div>
            </div>
        </Transition>

        <PlantsDrawer
            v-model:visible="isDrawerVisible"
            v-model="selectedPlant"
            :allow-area="false"
            title="Plant details"
        />
    </div>

    <div class="flex justify-between px-7 pb-7">
        <CustomButton variant="outline" @click="onBackClick">
            <ChevronLeftIcon />
            <span>{{ stepperValue === '1' ? 'Cancel' : 'Back' }}</span>
        </CustomButton>

        <CustomButton :is-disabled="isNextDisabled" :is-loading="isLoading" @click="onNextClick">
            <span>
                {{ isAtLastImg && stepperValue === '2' ? 'Create' : 'Next' }}
            </span>
            <ArrowRightCircleIcon />
        </CustomButton>
    </div>
</template>

<script setup lang="ts">
import {
    ArrowRightCircleIcon,
    CalendarDaysIcon,
    ChevronLeftIcon,
    TrashIcon
} from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import { computed, ref, useTemplateRef } from 'vue'
import ImageUpload from '@/components/ImageUpload.vue'
import PlantIndicator from '@/components/PlantIndicator.vue'
import FilesList from '@/components/FilesList.vue'
import { useRouter } from 'vue-router'
import { uploadAndCreateSetup } from '@/models/setup'
import { useToast } from '@/composables/useToast'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import { getColorFromIndex } from '@/utils/colors.utils'
import { UseDraggable } from '@vueuse/components'
import AreaAutocomplete from '@/components/AreaAutocomplete.vue'
import PlantsDrawer from '@/components/PlantsDrawer.vue'
import type { PlantInput } from '@/composables/usePlantsDrawer'

interface Plant {
    position: {
        x: number
        y: number
    }
    color: string
    name: string
}

interface PlantSetupImage {
    file: File & { objectURL: string }
    plants: Plant[]
}

interface FormData {
    images: PlantSetupImage[]
    area: string
}

const router = useRouter()

const { displayGenericError } = useToast()

const { invalidateSetupsQuery } = useSetupsQuery()

const stepperValue = ref('1')
const formData = ref<FormData>({ images: [], area: '' })
const selectedImgIndex = ref<number>(0)
const selectedIndicatorIndex = ref<number>()
const isLoading = ref(false)
const uploadProgressPercent = ref(0)

const selectedImg = computed({
    get: () => formData.value.images[selectedImgIndex.value],
    set: (value: PlantSetupImage) => {
        formData.value.images[selectedImgIndex.value] = value
    }
})

const isAtLastImg = computed(() => selectedImgIndex.value === formData.value.images.length - 1)

const isCreateDisabled = computed(() => {
    if (!isAtLastImg.value) {
        return false
    }

    const hasImageWithoutPlants = formData.value.images.some(({ plants }) => plants.length === 0)
    const hasUnnamedPlant = formData.value.images.some(({ plants }) =>
        plants.some(({ name }) => name.length === 0)
    )

    return hasImageWithoutPlants || hasUnnamedPlant
})

const isNextDisabled = computed(() =>
    stepperValue.value === '1' ? formData.value.images.length === 0 : isCreateDisabled.value
)

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
            file: selectedFile as File & { objectURL: string },
            plants: existingFile?.plants ?? []
        }
    })
}
// #endregion

// #region identifying plants in img
const imageRef = useTemplateRef('image')

const onImgClick = (event: PointerEvent) => {
    const imgPosition = imageRef.value?.getBoundingClientRect()
    if (!imgPosition) {
        return
    }

    const PLANT_INDICATOR_WIDTH = 14
    const halfWidth = PLANT_INDICATOR_WIDTH / 2
    const x = event.clientX - imgPosition.left - halfWidth
    const y = event.clientY - imgPosition.top - halfWidth

    const plantIndex = selectedImg.value?.plants.length

    if (typeof plantIndex === 'number' && selectedImg.value) {
        const color = getColorFromIndex(plantIndex)
        if (color) {
            const image = { ...selectedImg.value }
            image.plants.push({
                position: { x, y },
                name: '',
                color
            })

            selectedImg.value = image
        }
    }
}
// #endregion

// #region navigation
const isNextClicked = ref<boolean>(false)

const onNextClick = () => {
    if (stepperValue.value === '1') {
        stepperValue.value = '2'
        selectedImgIndex.value = 0
        return
    }

    if (selectedImgIndex.value < formData.value.images.length - 1) {
        selectedImgIndex.value += 1
        isNextClicked.value = true
        return
    }

    onSubmit()
}

const onBackClick = () => {
    if (stepperValue.value === '1') {
        router.back()
        return
    }

    if (selectedImgIndex.value === 0) {
        stepperValue.value = '1'
        return
    }

    selectedImgIndex.value -= 1
    isNextClicked.value = false
}

const onFileClick = (index: number) => {
    if (index === selectedImgIndex.value) {
        return
    }

    isNextClicked.value = index > selectedImgIndex.value
    selectedImgIndex.value = index
}
// #endregion

// #region drawer
const selectedPlant = ref<PlantInput>()

const isDrawerVisible = computed({
    get: () => Boolean(selectedPlant.value),
    set: (value: boolean) => {
        if (!value) {
            selectedPlant.value = undefined
        }
    }
})
// #endregion

// #region submission
const onSubmit = () => {
    isLoading.value = true
    uploadProgressPercent.value = 0

    try {
        formData.value.images.map(({ file, plants }) =>
            uploadAndCreateSetup(
                file,
                { area: formData.value.area },
                plants.map(({ position, name }) => ({ name, position, datetimes: [] })),
                progressPercent => {
                    // TODO: Display loading state
                    uploadProgressPercent.value = progressPercent / formData.value.images.length
                },
                () => {
                    isLoading.value = false

                    invalidateSetupsQuery()

                    router.push('/')
                }
            )
        )
    } catch (error) {
        console.log('CreatePlantsView onSubmit error', error)
        isLoading.value = false
        displayGenericError()
    }
}
// #endregion
</script>
