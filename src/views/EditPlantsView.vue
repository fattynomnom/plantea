<template>
    <div class="space-y-4 flex flex-col flex-1 overflow-hidden">
        <div class="flex-1 space-y-4 px-7 pb-7 overflow-y-scroll overflow-x-hidden">
            <h2>Edit setup</h2>

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

                        <CustomButton variant="link" @click="fileInputRef?.click()">
                            Replace image
                        </CustomButton>
                        <input
                            ref="file-input"
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onImageSelected"
                        />
                    </div>

                    <PlantSetupForm :image="displayImage" v-model:plants="setup.plants" />
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

        <CustomButton :is-disabled="isNextDisabled" :is-loading="isLoading" @click="onSubmit">
            <span>Save</span>
            <ArrowRightCircleIcon />
        </CustomButton>
    </div>
</template>

<script setup lang="ts">
import {
    ArrowRightCircleIcon,
    ChevronLeftIcon,
    InformationCircleIcon
} from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { updateSetupAndPlants, type Setup as BaseSetup } from '@/models/setup'
import { useToast } from '@/composables/useToast'
import { useSetupsQuery } from '@/composables/useSetupsQuery'
import PlantNotFoundCard from '@/components/PlantNotFoundCard.vue'
import { useDownloadUrlQuery } from '@/composables/useDownloadUrlQuery'
import { getColorFromIndex } from '@/utils/colors.utils'
import PlantSetupForm, { type PlantSetupFormData } from '@/components/PlantSetupForm.vue'
import AreaAutocomplete from '@/components/AreaAutocomplete.vue'
import { type UpdatePlantInput } from '@/models/plant'

interface PlantSetupEditFormData extends PlantSetupFormData {
    originalDatetimes: number[]
    frequencyDays: UpdatePlantInput['frequencyDays']
}

interface Setup extends BaseSetup {
    plants: PlantSetupEditFormData[]
    file?: File & { objectURL: string }
}

const route = useRoute()
const router = useRouter()

const { displayGenericError } = useToast()

const { data: setups, invalidateSetupsQuery } = useSetupsQuery()

const setup = ref<Setup>()

const isNextDisabled = computed(() => {
    const hasNoPlants = (setup.value?.plants.length ?? 0) === 0
    const hasUnnamedPlant = setup.value?.plants.some(({ name }) => name.trim().length === 0)

    return hasNoPlants || hasUnnamedPlant
})

watch(
    setups,
    value => {
        if (value && !setup.value) {
            const data = value.find(({ id }) => route.params.id === id)
            if (data) {
                setup.value = {
                    ...data,
                    plants: data.plants.map(
                        ({ id, setup, name, datetimes, frequencyDays }, index) => ({
                            id,
                            position: setup.position,
                            color: getColorFromIndex(index),
                            name,
                            dates: datetimes.map(datetime => new Date(datetime)),
                            originalDatetimes: datetimes,
                            frequencyDays
                        })
                    )
                }
            }
        }
    },
    { immediate: true }
)

// #region rendering image
const imgName = computed(() => setup.value?.imgName)
const { data: downloadUrl } = useDownloadUrlQuery(imgName)

const displayImage = computed(() => {
    const replacementFile = setup.value?.file
    if (replacementFile) {
        return { name: replacementFile.name, url: replacementFile.objectURL }
    }

    if (downloadUrl.value && setup.value) {
        return { name: setup.value.imgName, url: downloadUrl.value }
    }

    return undefined
})
// #endregion

// #region replace image
const fileInputRef = useTemplateRef('file-input')

const onImageSelected = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file || !setup.value) {
        return
    }

    if (setup.value.file) {
        URL.revokeObjectURL(setup.value.file.objectURL)
    }

    setup.value.file = {
        ...file,
        objectURL: URL.createObjectURL(file)
    }
}
// #endregion

// #region submission
const isLoading = ref(false)

const onSubmit = async () => {
    const data = setup.value
    if (!data || !data.plants.length) {
        return
    }

    isLoading.value = true

    try {
        await updateSetupAndPlants(
            data,
            data.plants.map(({ dates, ...plant }) => ({
                ...plant,
                datetimes: dates.map(date => date.getTime())
            })),
            () => {},
            () => {
                isLoading.value = false

                invalidateSetupsQuery()

                router.push('/')
            }
        )
    } catch (error) {
        console.log('EditPlantsView onSubmit error', error)
        isLoading.value = false
        displayGenericError()
    }
}
// #endregion
</script>
