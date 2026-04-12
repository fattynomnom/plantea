<template>
    <div class="space-y-4 h-full flex flex-col">
        <div>
            <h2>{{ stepperValue === '1' ? 'Upload plants setup' : 'Identify plants' }}</h2>
            <small v-if="stepperValue === '2'">
                Tap on a plant in the image(s) to identify it.
            </small>
        </div>

        <!-- <Stepper :value="stepperValue" linear>
            <StepList>
                <Step value="1">Upload plant setup</Step>
                <Step value="2">Identify plants</Step>
            </StepList>
        </Stepper> -->

        <form class="flex-1 flex flex-col">
            <Transition :name="stepperValue === '1' ? 'slide-right' : 'slide-left'">
                <div v-if="stepperValue === '1'" class="flex-1 space-y-7">
                    <ImageUpload
                        :initialFiles="formData.images.map(({ file }) => file)"
                        @update="onFilesUpdated"
                    />

                    <div class="flex flex-col space-y-2">
                        <label for="location-input">Where is this setup located? (Optional)</label>
                        <InputText
                            id="location-input"
                            v-model="formData.area"
                            type="text"
                            name="Location"
                            placeholder="Eg. Living room, Office"
                        />
                    </div>
                </div>

                <div v-else class="flex-1 space-y-4 flex flex-col">
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
                            <div :key="selectedImgIndex" v-if="selectedImg" class="relative">
                                <img
                                    ref="image"
                                    :alt="selectedImg.file.name"
                                    :src="selectedImg.file.objectURL"
                                    width="200"
                                    height="200"
                                    class="w-full cursor-pointer rounded-2xl"
                                    @click="onImgClick($event)"
                                />
                                <PlantIndicator
                                    v-for="(plant, plantIndex) in selectedImg.plants"
                                    :key="plant.name + plantIndex"
                                    :color="plant.color"
                                    class="absolute cursor-pointer hover:scale-150 transition ease-in-out duration-300"
                                    :style="{
                                        left: `${plant.position.x}px`,
                                        top: `${plant.position.y}px`,
                                        transform: `scale(${selectedIndicatorIndex === plantIndex ? 2.5 : 1})`
                                    }"
                                />
                            </div>
                        </Transition>

                        <div v-if="selectedImg" class="py-4 grid grid-cols-2 gap-3">
                            <div
                                v-for="(plant, plantIndex) in selectedImg.plants"
                                :key="`${plant.position.x}-${plant.position.y}-${plantIndex}`"
                                class="flex space-x-2 items-center"
                            >
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
                        </div>
                    </div>
                </div>
            </Transition>

            <div class="flex justify-between">
                <CustomButton variant="outline" @click="onBackClick">
                    <ChevronLeftIcon />
                    <span>{{ stepperValue === '1' ? 'Cancel' : 'Back' }}</span>
                </CustomButton>

                <CustomButton
                    :is-disabled="isNextDisabled"
                    :is-loading="isLoading"
                    @click="onNextClick"
                >
                    <span>
                        {{ isAtLastImg && stepperValue === '2' ? 'Create' : 'Next' }}
                    </span>
                    <ArrowRightCircleIcon />
                </CustomButton>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ArrowRightCircleIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import { computed, ref, useTemplateRef } from 'vue'
import { InputText } from 'primevue'
import ImageUpload from '@/components/ImageUpload.vue'
import PlantIndicator from '@/components/PlantIndicator.vue'
import FilesList from '@/components/FilesList.vue'
import { useRouter } from 'vue-router'
import { uploadAndCreateSetup } from '@/models/setup'
import { useToast } from '@/composables/useToast'

interface Image {
    file: File & { objectURL: string }
    plants: Array<{
        position: {
            x: number
            y: number
        }
        color: string
        name: string
    }>
}

interface FormData {
    images: Image[]
    area: string
}

const router = useRouter()

const { displayGenericError } = useToast()

const stepperValue = ref('1')
const formData = ref<FormData>({ images: [], area: '' })
const selectedImgIndex = ref<number>(0)
const selectedIndicatorIndex = ref<number>()
const isLoading = ref(false)
const uploadProgressPercent = ref(0)

const selectedImg = computed({
    get: () => formData.value.images[selectedImgIndex.value],
    set: (value: Image) => {
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
const imageRef = useTemplateRef('image')

const onImgClick = (event: PointerEvent) => {
    const containerRect = imageRef.value?.getBoundingClientRect()
    if (containerRect) {
        const PLANT_INDICATOR_WIDTH = 14
        const halfWidth = PLANT_INDICATOR_WIDTH / 2
        const x = event.clientX - containerRect.left - halfWidth
        const y = event.clientY - containerRect.top - halfWidth

        const plantIndex = selectedImg.value?.plants.length

        if (typeof plantIndex === 'number' && selectedImg.value) {
            const colorIndex =
                plantIndex >= colors.length
                    ? Math.floor(plantIndex / colors.length) - 1
                    : plantIndex
            const color = colors[colorIndex < 0 ? 0 : colorIndex]

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
                    uploadProgressPercent.value = progressPercent / formData.value.images.length
                },
                () => {
                    isLoading.value = false
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
