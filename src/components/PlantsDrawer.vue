<template>
    <Drawer v-model:visible="visible" header="Add new plant" position="bottom">
        <form class="space-y-7 px-7 pb-7" @submit.prevent="onSubmit">
            <div class="space-y-5">
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
                    <small v-if="error" class="color-danger">{{ error }}</small>
                </div>

                <div class="flex flex-col space-y-2">
                    <label for="name-input">Area (optional)</label>
                    <AreaAutocomplete
                        v-model="plant.area"
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
                            <DatePicker
                                v-model="plant.dates[index]"
                                dateFormat="dd/mm/yy"
                                placeholder="DD/MM/YYYY"
                                class="w-full"
                                :show-on-focus="false"
                            />
                            <div
                                class="rounded-2xl bg-white px-5 py-3 absolute right-0 top-0 color-primary"
                            >
                                <TrashIcon class="w-5 h-5" @click="plant.dates.splice(index, 1)" />
                            </div>
                        </div>
                    </div>
                </div>

                <CustomButton variant="link" @click="plant.dates.push(null)">
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
import { ref, watch } from 'vue'
import { DatePicker } from 'primevue'
import { createPlant, updatePlantWithRecommendation } from '@/models/plant'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import { useToast } from '@/composables/useToast'
import { usePlantsDrawer } from '@/composables/usePlantsDrawer'
import AreaAutocomplete from './AreaAutocomplete.vue'

const { isPlantsDrawerVisible: visible, plant, originalDatetimes, resetPlant } = usePlantsDrawer()

const { data: plants, invalidatePlantsQuery } = usePlantsQuery()

const { displayGenericError } = useToast()

const error = ref('')
const isLoading = ref(false)

const onSubmit = async () => {
    error.value = ''

    if (!plant.name) {
        error.value = 'Plant name is required.'
        return
    }

    const otherPlants =
        (plant.id
            ? plants.value?.singlePlants.filter(({ id }) => id !== plant.id)
            : plants.value?.singlePlants) ?? []
    if (
        otherPlants.some(
            ({ name, area }) =>
                `${name}-${area}`.toLowerCase() === `${plant.name}-${plant.area}`.toLowerCase()
        )
    ) {
        error.value = 'Plant name is already being used'
        return
    }

    isLoading.value = true

    try {
        const validDatetimes = (plant.dates.filter(date => Boolean(date)) as Date[]).map(date =>
            date.getTime()
        )

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
            error.value = ''
        }
    }
)
</script>
