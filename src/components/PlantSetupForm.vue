<template>
    <div class="space-y-4 flex flex-col flex-1 overflow-hidden">
        <div class="flex-1 space-y-4 px-7 pb-7 overflow-y-scroll overflow-x-hidden">
            <h2>{{ title }}</h2>

            <template v-if="setup">
                <div class="flex flex-col space-y-2">
                    <label for="location-input">Where is this setup located? (Optional)</label>
                    <AreaAutocomplete v-model="setup.area" placeholder="Eg. Living room, Office" />
                </div>

                <div class="flex flex-col space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <label>Plants in setup</label>
                            <InformationCircleIcon
                                class="w-5 h-5 outline-none"
                                v-tooltip.focus.left="
                                    'Tap on a plant in the image(s) to identify it. Hold and drag the indicator to move if needed.'
                                "
                            />
                        </div>

                        <CustomButton v-if="hasFile" variant="link" @click="onUploadClicked">
                            Replace image
                        </CustomButton>
                    </div>

                    <div v-if="!hasFile" class="rounded-2xl bg-white overflow-hidden py-16 px-7">
                        <div class="flex flex-col items-center space-y-5">
                            <div>
                                <CustomButton @click="onUploadClicked"> Upload image </CustomButton>
                            </div>
                            <p class="text-xs text-gray-500">
                                Upload a picture of your plant setup to get started.
                            </p>
                        </div>

                        <input
                            ref="file-input"
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onImageSelected"
                        />
                    </div>

                    <PlantSetupDetailsForm
                        :image="displayImage"
                        v-model:plants="setup.plants"
                        @add="onAddPlant"
                    />
                </div>
            </template>

            <PlantNotFoundCard v-else @add-plant="$router.push('/create')" />
        </div>
    </div>

    <div class="flex justify-between px-7 pb-7">
        <CustomButton variant="outline" @click="$router.go(-1)">
            <ChevronLeftIcon />
            <span>Cancel</span>
        </CustomButton>

        <CustomButton :is-disabled="isNextDisabled" :is-loading="isSaving" @click="onSubmit">
            <span>Save</span>
            <ArrowRightCircleIcon />
        </CustomButton>
    </div>

    <CropDrawer
        v-if="image"
        :visible="Boolean(image)"
        :url="image?.objectURL"
        @update:visible="onCropDrawerVisibleUpdated"
        @save="onCropDrawerSave"
    />
</template>

<script setup lang="ts">
import {
    ArrowRightCircleIcon,
    ChevronLeftIcon,
    InformationCircleIcon
} from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import { computed, ref, useTemplateRef, watch } from 'vue'
import PlantNotFoundCard from '@/components/PlantNotFoundCard.vue'
import { useDownloadUrlQuery } from '@/composables/useDownloadUrlQuery'
import PlantSetupDetailsForm, {
    type PlantSetupDetailsFormAddEmitterValue,
    type PlantSetupDetailsFormData
} from '@/components/PlantSetupDetailsForm.vue'
import AreaAutocomplete from '@/components/AreaAutocomplete.vue'
import { type UpdatePlantInput } from '@/models/plant'
import CropDrawer, { type CropDrawerSaveEmitterValue } from './CropDrawer.vue'
import { getFileExtension } from '@/utils/file.utils'
import { v4 } from 'uuid'

interface Plant extends PlantSetupDetailsFormData {
    originalDatetimes: number[]
    frequencyDays: UpdatePlantInput['frequencyDays']
}

export interface PlantSetupFormData {
    // optional - only required for editing
    id?: string
    // optional - only required for editing
    imgName?: string
    area?: string
    plants: Plant[]
    // optional - only required if there is an upload
    file?: {
        extension: string
        croppedImgBlob: Blob
        objectURL: string
    }
}

const { title, initialSetup, isSaving } = defineProps<{
    title: string
    initialSetup: PlantSetupFormData
    isSaving: boolean
}>()

const emit = defineEmits<{
    (e: 'save', value: PlantSetupFormData): Promise<void>
}>()

const setup = ref<PlantSetupFormData>(initialSetup)

const isNextDisabled = computed(() => {
    const hasNoPlants = (setup.value?.plants.length ?? 0) === 0
    const hasUnnamedPlant = setup.value?.plants.some(({ name }) => name.trim().length === 0)
    const hasNoImage = !setup.value?.imgName && !setup.value?.file

    return hasNoPlants || hasUnnamedPlant || hasNoImage
})

// #region file upload & cropping
const image = ref<{
    extension: string
    objectURL: string
}>()

const fileInput = useTemplateRef('file-input')

const hasFile = computed(() => Boolean(setup.value.imgName || setup.value.file))

const onUploadClicked = () => {
    fileInput.value?.click()
}

const onImageSelected = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
        image.value = {
            extension: getFileExtension(file),
            objectURL: URL.createObjectURL(file)
        }
    }
}

const onCropDrawerVisibleUpdated = (value: boolean) => {
    if (!value) {
        image.value = undefined
    }
}

const onCropDrawerSave = ({ blob, objectURL }: CropDrawerSaveEmitterValue) => {
    const imageRef = image.value
    if (!imageRef) {
        return
    }

    setup.value.file = {
        extension: imageRef.extension,
        croppedImgBlob: blob,
        objectURL
    }

    onCropDrawerVisibleUpdated(false)
}
// #endregion

// #region rendering image
const imgName = computed(() => setup.value?.imgName)
const { data: downloadUrl } = useDownloadUrlQuery(imgName)

const displayImage = computed(() => {
    const file = setup.value?.file
    if (file) {
        return { url: file.objectURL }
    }

    if (downloadUrl.value && setup.value) {
        return { name: setup.value.imgName, url: downloadUrl.value }
    }

    return undefined
})
// #endregion

// #region form
const onAddPlant = ({ positionPercentage, color }: PlantSetupDetailsFormAddEmitterValue) => {
    setup.value.plants.push({
        id: v4(),
        positionPercentage,
        color,
        name: '',
        dates: [],
        originalDatetimes: [],
        frequencyDays: undefined
    })
}

const onSubmit = async () => {
    const data = setup.value
    if (!data || !data.plants.length) {
        return
    }

    emit('save', setup.value)
}
// #endregion

watch(
    () => initialSetup,
    value => {
        setup.value = value
    },
    { immediate: true }
)
</script>
