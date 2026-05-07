<template>
    <Drawer v-model:visible="visible" :header="title" position="bottom">
        <form class="space-y-7 px-7 pb-7" @submit.prevent="onSubmit">
            <div class="space-y-6">
                <div class="flex flex-col space-y-2">
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

                <div v-if="allowArea" class="flex flex-col space-y-2">
                    <label for="name-input">Area (optional)</label>
                    <AreaAutocomplete
                        v-model="plant.area"
                        placeholder="Area which the plant is located in"
                    />
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

                    <div v-if="existingNames" class="space-y-2 mt-3">
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

                    <div v-if="isManualAddDate" class="space-y-3 mt-4">
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
import { ArrowRightCircleIcon, PlusCircleIcon, TrashIcon } from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import Drawer from 'primevue/drawer'
import { computed, ref, watch } from 'vue'
import { RadioButton, Select } from 'primevue'
import { createPlant, updatePlantWithRecommendation, type Plant } from '@/models/plant'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import { useToast } from '@/composables/useToast'
import AreaAutocomplete from './AreaAutocomplete.vue'
import type { PlantInput } from '@/composables/usePlantsDrawer'
import dayjs from 'dayjs'

interface Option {
    label: string
    value: string
}

const visible = defineModel<boolean>('visible', { required: true })
const plant = defineModel<PlantInput>('modelValue', {
    default: {
        id: undefined,
        name: '',
        dates: [],
        area: undefined
    }
})

const {
    originalDatetimes,
    allowArea = true,
    title
} = defineProps<{
    originalDatetimes?: Plant['datetimes']
    allowArea?: boolean
    title: string
}>()

const emit = defineEmits<{
    (e: 'reset'): void
}>()

const { data: plants, invalidatePlantsQuery } = usePlantsQuery()

const { displayGenericError } = useToast()

const isManualAddDate = ref(true)
const nameError = ref('')
const dateErrors = ref<boolean[]>([])
const isLoading = ref(false)

const existingNames = computed(() => {
    const singlePlantNames = plants.value?.singlePlants.map(({ name }) => name) ?? []
    const plantSetupNames = plants.value?.plantsWithSetup.map(({ name }) => name) ?? []
    const names = singlePlantNames?.concat(plantSetupNames)

    return [...new Set(names)]
})

const allPlants = computed(
    () => plants.value?.singlePlants.concat(plants.value.plantsWithSetup) ?? []
)

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

const resetDateErrors = () => {
    dateErrors.value = plant.value.dates.map(() => false)
}

const resetErrors = () => {
    nameError.value = ''
    resetDateErrors()
}

const importPlantDates = ({ value: plantId }: Pick<Option, 'value'>) => {
    const datetimes = allPlants.value.find(({ id }) => id === plantId)?.datetimes
    if (datetimes) {
        plant.value.dates = datetimes.map(datetime => dayjs(datetime).format('DD/MM/YYYY'))
        isManualAddDate.value = true
        resetDateErrors()
    }
}

const addDate = () => {
    plant.value.dates.push(null)
    dateErrors.value.push(false)
}

const removeDate = (index: number) => {
    plant.value.dates.splice(index, 1)
    dateErrors.value.splice(index, 1)
}

const resetDates = () => {
    plant.value.dates = [null]
    resetDateErrors()
}

const onInputDate = (e: InputEvent, index: number) => {
    const value = (e.target as HTMLInputElement).value

    if (value.length === 2 || value.length === 5) {
        plant.value.dates[index] = value + '/'
        return
    }

    if (value.length > 10) {
        return
    }

    plant.value.dates[index] = value
}

const onSubmit = async () => {
    resetErrors()

    if (!plant.value.name) {
        nameError.value = 'Plant name is required.'
    }

    const otherPlants =
        (plant.value.id
            ? plants.value?.singlePlants.filter(({ id }) => id !== plant.value.id)
            : plants.value?.singlePlants) ?? []
    if (
        !nameError.value &&
        otherPlants.some(
            ({ name, area }) =>
                `${name}-${area}`.toLowerCase() ===
                `${plant.value.name}-${plant.value.area}`.toLowerCase()
        )
    ) {
        nameError.value = 'Plant name is already being used'
    }

    const dates = plant.value.dates.map(dateText => {
        if (dateText) {
            const [day, month, year] = dateText.split('/')
            return new Date(`${month}/${day}/${year}`)
        }

        return null
    })
    dateErrors.value = dates.map(date => (date ? isNaN(date as unknown as number) : false))

    if (nameError.value || dateErrors.value.some(Boolean)) {
        return
    }

    isLoading.value = true

    try {
        const validDatetimes = (dates.filter(Boolean) as Date[]).map(date => date.getTime())

        if (plant.value.id) {
            if (!originalDatetimes) {
                throw new Error('Missing original datetimes.')
            }

            await updatePlantWithRecommendation(
                { datetimes: originalDatetimes },
                {
                    ...plant.value,
                    id: plant.value.id,
                    datetimes: validDatetimes
                }
            )
        } else {
            await createPlant({
                ...plant.value,
                datetimes: validDatetimes
            })
        }

        await invalidatePlantsQuery()

        emit('reset')

        visible.value = false
    } catch {
        displayGenericError()
    } finally {
        isLoading.value = false
    }
}

watch(
    () => plant.value.name,
    value => {
        console.log(1, value)
        if (value) {
            resetErrors()
        }
    }
)
</script>

<style scoped>
.radio-container {
    @apply flex items-center space-x-2;
}

.radio-container > label {
    @apply font-normal;
}
</style>
