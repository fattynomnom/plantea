<template>
    <Drawer v-model:visible="visible" header="Add new plant" position="bottom">
        <form class="space-y-7 px-7 pb-7" @submit.prevent="onSubmit">
            <div class="space-y-5">
                <div class="flex flex-col space-y-2">
                    <label for="name-input">Name</label>
                    <input
                        id="name-input"
                        v-model.trim="plant.name"
                        text="text"
                        name="Name"
                        autocomplete="off"
                        placeholder="Name of plant"
                        class="p-inputtext"
                    />
                    <small v-if="nameError" class="color-danger">{{ nameError }}</small>
                </div>

                <div class="flex flex-col space-y-2">
                    <label for="name-input">Area (optional)</label>
                    <AutoComplete
                        v-model.trim="plant.area"
                        :suggestions="filteredAreas"
                        fluid
                        show-clear
                        placeholder="Area which the plant is located in"
                    />
                </div>

                <div v-if="plant.dates.length" class="flex flex-col space-y-2">
                    <div class="flex items-center justify-between">
                        <label for="watering-date-inputs">Watering dates</label>
                        <CustomButton variant="link" color="danger" @click="plant.dates = []">
                            Clear all dates
                        </CustomButton>
                    </div>
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
                                <TrashIcon class="w-5 h-5" @click="removeDate(index)" />
                            </div>
                            <small v-if="dateErrors[index]" class="color-danger">
                                Invalid date
                            </small>
                        </div>
                    </div>
                </div>

                <CustomButton variant="link" @click="addDate">
                    <PlusCircleIcon />
                    <span>{{
                        plant.dates.length ? 'Add another date' : 'Add watering dates (optional)'
                    }}</span>
                </CustomButton>
            </div>

            <div class="flex justify-end">
                <CustomButton type="submit" :is-loading="isLoading">
                    <span>{{ plant.id ? 'Update' : 'Create' }}</span>
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
import { AutoComplete } from 'primevue'
import { createPlant, updatePlantWithRecommendation } from '@/models/plant'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import { useToast } from '@/composables/useToast'
import { usePlantsDrawer } from '@/composables/usePlantsDrawer'

const { isPlantsDrawerVisible: visible, plant, originalDatetimes, resetPlant } = usePlantsDrawer()

const { data: plants, invalidatePlantsQuery } = usePlantsQuery()

const { displayGenericError } = useToast()

const existingAreas = computed(
    () =>
        [
            ...new Set(plants.value?.map(({ area }) => area).filter(area => Boolean(area)) ?? [])
        ] as string[]
)

const filteredAreas = computed(() =>
    plant.area
        ? existingAreas.value.filter(area => area.toLowerCase().includes(plant.area!.toLowerCase()))
        : existingAreas.value
)

const nameError = ref('')
const dateErrors = ref<boolean[]>([])
const isLoading = ref(false)

const resetErrors = () => {
    nameError.value = ''
    dateErrors.value = plant.dates.map(() => false)
}

const addDate = () => {
    plant.dates.push(null)
    dateErrors.value.push(false)
}

const removeDate = (index: number) => {
    plant.dates.splice(index, 1)
    dateErrors.value.splice(index, 1)
}

const onInputDate = (e: InputEvent, index: number) => {
    const value = (e.target as HTMLInputElement).value

    if (value.length === 2 || value.length === 5) {
        plant.dates[index] = value + '/'
        return
    }

    if (value.length > 10) {
        return
    }

    plant.dates[index] = value
}

const onSubmit = async () => {
    resetErrors()

    if (!plant.name) {
        nameError.value = 'Plant name is required.'
    }

    const otherPlants =
        (plant.id ? plants.value?.filter(({ id }) => id !== plant.id) : plants.value) ?? []
    if (
        !nameError.value &&
        otherPlants.some(
            ({ name, area }) =>
                `${name}-${area}`.toLowerCase() === `${plant.name}-${plant.area}`.toLowerCase()
        )
    ) {
        nameError.value = 'Plant name is already being used'
    }

    const dates = plant.dates.map(dateText => {
        if (dateText) {
            const [day, month, year] = dateText.split('/')
            return new Date(`${month}/${day}/${year}`)
        }

        return null
    })
    console.log(0, dates)
    dateErrors.value = dates.map(date => (date ? isNaN(date as unknown as number) : false))

    if (nameError.value || dateErrors.value.some(Boolean)) {
        return
    }

    isLoading.value = true

    try {
        const validDatetimes = (dates.filter(Boolean) as Date[]).map(date => date.getTime())

        if (plant.id) {
            if (!originalDatetimes.value) {
                throw new Error('Missing original datetimes.')
            }

            await updatePlantWithRecommendation(
                { datetimes: originalDatetimes.value },
                {
                    ...plant,
                    id: plant.id,
                    datetimes: validDatetimes
                }
            )
        } else {
            await createPlant({
                ...plant,
                datetimes: validDatetimes
            })
        }

        await invalidatePlantsQuery()

        resetPlant()

        visible.value = false
    } catch {
        displayGenericError()
    } finally {
        isLoading.value = false
    }
}

watch(
    () => plant.name,
    value => {
        if (value) {
            resetErrors()
        }
    }
)
</script>
