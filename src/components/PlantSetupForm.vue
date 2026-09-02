<template>
    <div class="space-y-4 flex flex-col flex-1 overflow-y-scroll">
        <div class="flex-1 space-y-4 px-7 pb-7">
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
                                v-if="hasFile"
                                class="w-5 h-5 outline-none cursor-pointer"
                                @click="infoCalloutVisible = !infoCalloutVisible"
                            />
                        </div>

                        <CustomButton v-if="hasFile" variant="link" @click="onUploadClicked">
                            Replace image
                        </CustomButton>
                    </div>

                    <Transition name="reveal">
                        <div v-if="infoCalloutVisible" class="reveal-panel">
                            <div class="reveal-panel-inner">
                                <div class="rounded-2xl p-3 bg-white text-sm flex space-x-2">
                                    <InformationCircleIcon class="w-5 h-5 shrink-0" />
                                    <span>
                                        Tap on a plant in the image to identify it. Hold and drag
                                        the indicator to move if needed.
                                    </span>
                                    <XMarkIcon
                                        class="w-5 h-5"
                                        @click="infoCalloutVisible = false"
                                    />
                                </div>
                            </div>
                        </div>
                    </Transition>

                    <div v-if="!hasFile" class="rounded-2xl bg-white overflow-hidden py-16 px-7">
                        <div class="flex flex-col items-center space-y-5">
                            <div>
                                <CustomButton @click="onUploadClicked">Upload image</CustomButton>
                            </div>
                            <p class="text-xs text-gray-500">
                                Upload a picture of your plant setup to get started.
                            </p>
                        </div>
                    </div>

                    <input
                        ref="file-input"
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="onImageSelected"
                    />

                    <PlantSetupDetailsForm
                        :image="displayImage"
                        v-model:plants="setup.plants"
                        @add="onAddPlant"
                    />
                </div>
            </template>

            <PlantNotFoundCard v-else @add-plant="$router.push('/create')" />
        </div>

        <div class="flex justify-between px-7 pb-7">
            <CustomButton v-if="setup.id" variant="outline" @click="deleteConfirmVisible = true">
                <TrashIcon />
                <span>Delete</span>
            </CustomButton>
            <div v-else />

            <CustomButton :is-disabled="isNextDisabled" :is-loading="isSaving" @click="onSubmit">
                <span>Save</span>
                <ArrowRightCircleIcon />
            </CustomButton>
        </div>
    </div>

    <CropDrawer
        v-if="image"
        :visible="Boolean(image)"
        :url="image?.objectURL"
        @update:visible="onCropDrawerVisibleUpdated"
        @save="onCropDrawerSave"
    />

    <DeleteConfirmationDialog
        v-model:visible="deleteConfirmVisible"
        :is-loading="isDeleting"
        @confirm="onDeleteConfirm"
    >
        Are you sure you want to delete this setup and all of its data? This action cannot be
        undone.
    </DeleteConfirmationDialog>
</template>

<script setup lang="ts">
import { ArrowRightCircleIcon, InformationCircleIcon, TrashIcon } from '@heroicons/vue/24/outline'
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
import DeleteConfirmationDialog from './DeleteConfirmationDialog.vue'
import { deleteSetupAndPlants } from '@/models/setup'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import { XMarkIcon } from '@heroicons/vue/24/solid'

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

const router = useRouter()

const { displayGenericError } = useToast()

const { invalidateSetupsQuery } = useSetupsQuery()

const infoCalloutVisible = ref(false)

const setup = ref<PlantSetupFormData>({
    ...initialSetup,
    plants: [...initialSetup.plants]
})

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

    if (downloadUrl.value && setup.value.imgName) {
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

// #region delete
const deleteConfirmVisible = ref(false)
const isDeleting = ref(false)

const onDeleteConfirm = async () => {
    if (!setup.value.id || !setup.value.imgName) {
        return
    }

    isDeleting.value = true

    try {
        const plantIds = setup.value.plants.map(({ id }) => id)

        await deleteSetupAndPlants(
            {
                id: setup.value.id,
                imgName: setup.value.imgName
            },
            plantIds
        )

        deleteConfirmVisible.value = false
        await invalidateSetupsQuery()
        router.push('/')
    } catch (error) {
        console.log('Delete setup error', error)
        displayGenericError()
    } finally {
        isDeleting.value = false
    }
}
// #endregion

watch(
    () => initialSetup,
    (newValue, oldValue) => {
        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
            setup.value = {
                ...newValue,
                plants: [...newValue.plants]
            }
        }
    },
    { immediate: true }
)
</script>

<style scoped>
/* grid is used so the panel height can animate. CSS cannot transition height: auto to 0. */
.reveal-panel {
    display: grid;
    grid-template-rows: 1fr;
}

.reveal-panel-inner {
    min-height: 0;
    overflow: hidden;
}

.reveal-enter-active,
.reveal-leave-active {
    transition:
        grid-template-rows 0.3s ease-out,
        opacity 0.25s ease-out;
}

.reveal-enter-from,
.reveal-leave-to {
    grid-template-rows: 0fr;
    opacity: 0;
}

.reveal-enter-to,
.reveal-leave-from {
    grid-template-rows: 1fr;
}
</style>
