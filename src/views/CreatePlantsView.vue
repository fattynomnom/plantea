<template>
    <div class="space-y-4 flex flex-col flex-1 overflow-y-hidden">
        <Transition :name="stepperValue === '1' ? 'slide-right' : 'slide-left'">
            <div v-if="stepperValue === '1'" class="flex-1 space-y-4 px-7 pb-7">
                <h2>Upload plants setup</h2>

                <ImageUpload
                    ref="image-upload"
                    :image="formData.images[0] ?? undefined"
                    @update:image="updateImage"
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

                <PlantSetupDetailsForm
                    class="flex-1"
                    :transition-name="isNextClicked ? 'slide-left' : 'slide-right'"
                    :image="
                        selectedImg
                            ? {
                                  url: selectedImg.croppedImg.objectURL
                              }
                            : undefined
                    "
                    :plants="selectedImg?.plants ?? []"
                    @update:plants="updatePlants"
                />
            </div>
        </Transition>
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
import { ArrowRightCircleIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import { computed, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { uploadAndCreateSetup } from '@/models/setup'
import { useToast } from '@/composables/useToast'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import AreaAutocomplete from '@/components/AreaAutocomplete.vue'
import PlantSetupDetailsForm, {
    type PlantSetupFormData
} from '@/components/PlantSetupDetailsForm.vue'
import type { Image } from '@/components/ImageUpload.vue'
import ImageUpload from '@/components/ImageUpload.vue'

interface PlantSetupImage extends Image {
    plants: PlantSetupFormData[]
}

interface FormData {
    images: PlantSetupImage[]
    area: string
}

const router = useRouter()

const { displayGenericError } = useToast()

const { invalidateSetupsQuery } = useSetupsQuery()

const formData = ref<FormData>({ images: [], area: '' })
const selectedImgIndex = ref<number>(0)

const imageUpload = useTemplateRef('image-upload')

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

const updateImage = (image?: Image) => {
    if (!image) {
        return
    }

    const firstImage = formData.value.images[0]
    if (firstImage) {
        formData.value.images[0] = {
            ...firstImage,
            ...image
        }
    } else {
        formData.value.images.push({
            ...image,
            plants: []
        })
    }
}

// #region navigation
const isNextClicked = ref<boolean>(false)
const stepperValue = ref('1')

const onNextClick = () => {
    if (stepperValue.value === '1') {
        imageUpload.value?.confirmCrop()
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
// #endregion

// #region manage plants
const updatePlants = (plants: PlantSetupFormData[]) => {
    if (selectedImg.value) {
        selectedImg.value.plants = plants
    }
}
// #endregion

// #region submission
const isLoading = ref(false)
const uploadProgressPercent = ref(0)

const onSubmit = () => {
    isLoading.value = true
    uploadProgressPercent.value = 0

    try {
        formData.value.images.map(({ originalFile, croppedImg, plants }) =>
            uploadAndCreateSetup(
                {
                    file: {
                        extension: originalFile.extension,
                        croppedImgBlob: croppedImg.blob
                    },
                    area: formData.value.area
                },
                plants.map(({ position, name, dates }) => ({
                    name,
                    position,
                    datetimes: dates.map(date => date.getTime())
                })),
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
