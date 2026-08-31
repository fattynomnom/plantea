<template>
    <Drawer v-model:visible="visible" :header="title" position="bottom">
        <form class="space-y-7 px-7 pb-7" @submit.prevent="onSubmit">
            <div class="space-y-6">
                <div class="form-input">
                    <label for="name-input">Name</label>
                    <input
                        id="name-input"
                        v-model.trim="plant.name"
                        type="text"
                        name="Name"
                        autocomplete="off"
                        placeholder="Name of plant"
                        class="p-inputtext"
                    />
                    <small v-if="nameError" class="color-danger">{{ nameError }}</small>
                </div>

                <div v-if="allowArea" class="form-input">
                    <label for="area-input">Area (optional)</label>
                    <AreaAutocomplete
                        v-model="plant.area"
                        id="area-input"
                        placeholder="Area which the plant is located in"
                    />
                </div>

                <div class="form-input">
                    <label for="frequency-input">Watering frequency (days)</label>
                    <div class="grid grid-cols-5 gap-2">
                        <input
                            v-model.trim="plant.frequencyDays"
                            text="text"
                            name="Watering frequency"
                            autocomplete="off"
                            class="p-inputtext col-span-3"
                            inputmode="numeric"
                            maxlength="10"
                        />

                        <CustomButton
                            type="button"
                            variant="outline"
                            class="col-span-2"
                            :is-loading="isAutoGenerating"
                            @click="onAutoGenerateClick"
                        >
                            <SparklesIcon />
                            <span>Generate</span>
                        </CustomButton>
                    </div>
                </div>

                <div class="flex flex-col">
                    <div class="flex items-center justify-between">
                        <label for="watering-date-inputs">Watering dates (optional)</label>
                        <CustomButton
                            v-if="plant.dates.length > 1"
                            variant="link"
                            color="danger"
                            @click="resetDates"
                        >
                            Clear all dates
                        </CustomButton>
                    </div>

                    <div v-if="hasPlants" class="space-y-2 mt-3">
                        <div class="radio-container">
                            <RadioButton
                                v-model="isManualAddDate"
                                inputId="manually"
                                name="add-date-method"
                                :value="true"
                            />
                            <label for="manually">Enter dates manually</label>
                        </div>

                        <div class="radio-container">
                            <RadioButton
                                v-model="isManualAddDate"
                                inputId="copy"
                                name="add-date-method"
                                :value="false"
                            />
                            <label for="copy">Copy dates from existing plant</label>
                        </div>
                    </div>

                    <div v-if="isManualAddDate" :class="`space-y-3 ${hasPlants ? 'mt-4' : 'mt-2'}`">
                        <div
                            id="watering-date-inputs"
                            :class="{ 'grid grid-cols-2 gap-2': plant.dates.length > 1 }"
                        >
                            <div
                                v-for="(_, index) in plant.dates"
                                :key="`watering-date-${index}`"
                                class="relative"
                            >
                                <input
                                    :value="plant.dates[index]"
                                    text="text"
                                    :name="`Plant date ${index}`"
                                    autocomplete="off"
                                    placeholder="DD/MM/YYYY"
                                    class="p-inputtext w-full"
                                    inputmode="numeric"
                                    maxlength="10"
                                    @input="e => onInputDate(e, index)"
                                />
                                <div
                                    class="rounded-2xl bg-white px-5 py-3 absolute right-0 top-0 color-primary"
                                >
                                    <TrashIcon
                                        v-if="plant.dates.length > 1"
                                        class="w-5 h-5"
                                        @click="removeDate(index)"
                                    />
                                </div>
                                <small v-if="dateErrors[index]" class="color-danger">
                                    Invalid date
                                </small>
                            </div>
                        </div>

                        <CustomButton
                            :is-disabled="plant.dates.length >= 10"
                            variant="link"
                            @click="addDate"
                        >
                            <PlusCircleIcon />
                            <span>Add another date</span>
                        </CustomButton>
                    </div>

                    <Select
                        v-else
                        :options="groupedPlants"
                        optionLabel="label"
                        optionGroupLabel="label"
                        optionGroupChildren="items"
                        placeholder="Select an existing plant"
                        class="p-inputtext mt-4"
                        @update:model-value="importPlantDates"
                    />
                </div>
            </div>

            <div class="flex justify-between">
                <CustomButton
                    v-if="allowDelete"
                    type="button"
                    variant="outline"
                    @click="deleteConfirmVisible = true"
                >
                    <TrashIcon />
                    <span>Delete</span>
                </CustomButton>
                <div v-else />
                <CustomButton type="submit" :is-loading="isLoading">
                    <span>Save</span>
                    <ArrowRightCircleIcon />
                </CustomButton>
            </div>
        </form>
    </Drawer>

    <DeleteConfirmationDialog
        v-model:visible="deleteConfirmVisible"
        :is-loading="isDeleting"
        @confirm="onDeleteConfirm"
    >
        Are you sure you want to delete this plant and all of its data? If this plant belongs to a
        setup and is the only plant in the setup, the entire setup will be deleted. This action
        cannot be undone.
    </DeleteConfirmationDialog>
</template>

<script setup lang="ts">
import {
    ArrowRightCircleIcon,
    PlusCircleIcon,
    SparklesIcon,
    TrashIcon
} from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue'
import Drawer from 'primevue/drawer'
import { computed, reactive, ref, watch } from 'vue'
import { RadioButton, Select } from 'primevue'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import AreaAutocomplete from './AreaAutocomplete.vue'
import dayjs from 'dayjs'
import { convertTextToDate, convertTextsToDates, convertTextsToDatetimes } from '@/utils/date.utils'
import { deletePlant, genPlantAnalysis, type Plant } from '@/models/plant'
import { useToast } from '@/composables/useToast'
import { useSetupsQuery } from '@/composables/useSetupsQuery'

export interface PlantInput extends Pick<Plant, 'name' | 'area' | 'setup' | 'frequencyDays'> {
    id?: string
    dates: Array<string | null>
}

export interface PlantOutput extends Omit<PlantInput, 'dates'> {
    dates: Date[]
}

interface Option {
    label: string
    value: string
}

const plant = reactive<PlantInput>({
    id: undefined,
    name: '',
    dates: [],
    area: undefined,
    setup: undefined
})

const visible = defineModel<boolean>('visible', { required: true })

const {
    allowArea = true,
    allowDelete = true,
    isLoading = false,
    title,
    initialValue = {
        id: undefined,
        name: '',
        dates: [],
        area: undefined
    }
} = defineProps<{
    allowArea?: boolean
    allowDelete?: boolean
    isLoading?: boolean
    title: string
    initialValue?: PlantInput
}>()

const emit = defineEmits<{
    (e: 'submit', data: PlantOutput): Promise<void>
    (e: 'delete'): Promise<void>
}>()

const { data: plants } = usePlantsQuery()
const { data: setups } = useSetupsQuery()

const { displayGenericError } = useToast()

const allPlants = computed(
    () => plants.value?.singlePlants.concat(plants.value.plantsWithSetup) ?? []
)

const hasPlants = computed(() => allPlants.value.length > 0)

const groupedPlants = computed(() => {
    const map =
        allPlants.value.reduce<Record<string, Option[]>>((acc, plant) => {
            const area = plant.area ?? 'No areas specified'
            const plants = acc[area] ?? []
            plants.push({ label: plant.name, value: plant.id })
            acc[area] = plants

            return acc
        }, {}) ?? {}

    return Object.entries(map).map(([area, items]) => ({
        label: area,
        items
    }))
})

// #region errors/validation
const nameError = ref('')
const dateErrors = ref<boolean[]>([])

const hasDateErrors = computed(() => dateErrors.value.some(Boolean))

const validateDates = () => {
    dateErrors.value = plant.dates.map(dateText => {
        const value = dateText?.trim()
        if (value) {
            const date = convertTextToDate(value)
            return isNaN(date as unknown as number)
        }

        return false
    })
}

const validatePlantsData = () => {
    if (!plant.name) {
        nameError.value = 'Plant name is required.'
    }

    // TODO: check this validation again
    const otherPlants =
        (plant.id
            ? plants.value?.singlePlants.filter(({ id }) => id !== plant.id)
            : plants.value?.singlePlants) ?? []
    if (
        !nameError.value &&
        otherPlants.some(
            ({ name, area }) =>
                `${name}-${area}`.toLowerCase() === `${plant.name}-${plant.area}`.toLowerCase()
        )
    ) {
        nameError.value = 'Plant name is already being used'
    }

    validateDates()

    // TODO: validate that entered dates is not in the future
}

const resetNameError = () => {
    nameError.value = ''
}

const resetDateErrors = () => {
    dateErrors.value = plant.dates.map(() => false)
}

const resetErrors = () => {
    resetNameError()
    resetDateErrors()
}
// #endregion

// #region dates
const isManualAddDate = ref(true)

const importPlantDates = ({ value: plantId }: Pick<Option, 'value'>) => {
    const datetimes = allPlants.value.find(({ id }) => id === plantId)?.datetimes
    if (datetimes) {
        plant.dates = datetimes.map(datetime => dayjs(datetime).format('DD/MM/YYYY'))
        isManualAddDate.value = true
        resetDateErrors()
    }
}

const addDate = () => {
    plant.dates.push(null)
    dateErrors.value.push(false)
}

const removeDate = (index: number) => {
    plant.dates.splice(index, 1)
    dateErrors.value.splice(index, 1)
}

const resetDates = () => {
    plant.dates = [null]
    resetDateErrors()
}

const onInputDate = (e: InputEvent, index: number) => {
    const value = (e.target as HTMLInputElement).value.trim()

    if (value.length === 2 || value.length === 5) {
        plant.dates[index] = value + '/'
        return
    }

    if (value.length > 10) {
        return
    }

    plant.dates[index] = value
}

watch(
    isManualAddDate,
    value => {
        if (value && plant.dates.length === 0) {
            plant.dates.push(null)
        }
    },
    { immediate: true }
)
// #endregion

// #region generate frequency days
const isAutoGenerating = ref(false)

const onAutoGenerateClick = async () => {
    resetErrors()
    validatePlantsData()

    if (nameError.value || hasDateErrors.value) {
        return
    }

    isAutoGenerating.value = true

    try {
        plant.frequencyDays = await genPlantAnalysis({
            name: plant.name,
            datetimes: convertTextsToDatetimes(plant.dates)
        })
    } catch {
        displayGenericError()
    } finally {
        isAutoGenerating.value = false
    }
}
// #endregion

// #region delete
const deleteConfirmVisible = ref(false)
const isDeleting = ref(false)

const onDeleteConfirm = async () => {
    if (!plant.id) {
        return
    }

    isDeleting.value = true

    try {
        const setupId = plant.setup?.id
        const setup = setupId ? setups.value?.find(({ id }) => id === setupId) : null

        await deletePlant(
            plant.id,
            setup
                ? {
                      id: setup.id,
                      imgName: setup.imgName,
                      plantsCount: setup.plants.length
                  }
                : null
        )

        deleteConfirmVisible.value = false

        emit('delete')
    } catch (error) {
        console.log('Delete plant error', error)
        displayGenericError()
    } finally {
        isDeleting.value = false
    }
}
// #endregion

const onSubmit = async () => {
    resetErrors()
    validatePlantsData()

    if (nameError.value || hasDateErrors.value) {
        return
    }

    await emit('submit', {
        ...plant,
        dates: convertTextsToDates(plant.dates)
    })
}

watch(
    () => plant.name,
    () => {
        if (nameError.value) {
            resetNameError()
        }
    }
)

// TODO: fix watcher not working - use react-hook-form instead
watch(
    () => plant.dates,
    () => {
        if (hasDateErrors.value) {
            resetDateErrors()
        }
    }
)

watch(visible, value => {
    if (value) {
        plant.id = initialValue.id
        plant.name = initialValue.name
        plant.dates = initialValue.dates.length ? initialValue.dates : [null]
        plant.area = initialValue.area
        plant.setup = initialValue.setup
        plant.frequencyDays = initialValue.frequencyDays
    }
})
</script>

<style scoped>
.radio-container {
    @apply flex items-center space-x-2;
}

.radio-container > label {
    @apply font-normal;
}

.form-input {
    @apply flex flex-col space-y-2;
}
</style>
