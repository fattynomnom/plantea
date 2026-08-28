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

                        <CustomButton type="button" variant="outline" class="col-span-2">
                            <SparklesIcon />
                            <span>Auto generate</span>
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

            <div class="flex justify-end">
                <CustomButton type="submit" :is-loading="isLoading">
                    <span>Save</span>
                    <ArrowRightCircleIcon />
                </CustomButton>
            </div>
        </form>
    </Drawer>
</template>

<script setup lang="ts">
import {
    ArrowRightCircleIcon,
    PlusCircleIcon,
    SparklesIcon,
    TrashIcon
} from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import Drawer from 'primevue/drawer'
import { computed, reactive, ref, watch } from 'vue'
import { RadioButton, Select } from 'primevue'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import AreaAutocomplete from './AreaAutocomplete.vue'
import dayjs from 'dayjs'
import { convertTextToDate } from '@/utils/date.utils'
import type { Plant } from '@/models/plant'

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
    shouldValidate = true,
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
    shouldValidate?: boolean
    isLoading?: boolean
    title: string
    initialValue?: PlantInput
}>()

const emit = defineEmits<{
    (e: 'submit', data: PlantOutput): Promise<void>
}>()

const { data: plants } = usePlantsQuery()

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

    dateErrors.value = plant.dates.map(dateText => {
        const value = dateText?.trim()
        if (value) {
            const date = convertTextToDate(value)
            return isNaN(date as unknown as number)
        }

        return false
    })

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

const onSubmit = async () => {
    resetErrors()

    if (shouldValidate) {
        validatePlantsData()

        if (nameError.value || hasDateErrors.value) {
            return
        }
    }

    const validDatetimes = plant.dates.reduce<Date[]>((acc, dateText) => {
        const value = dateText?.trim()
        if (value) {
            return acc.concat(convertTextToDate(value))
        }

        return acc
    }, [])

    await emit('submit', {
        ...plant,
        dates: validDatetimes
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
        plant.dates = initialValue.dates
        plant.area = initialValue.area
        plant.setup = initialValue.setup
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
