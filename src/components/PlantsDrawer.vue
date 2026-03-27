<template>
    <Drawer v-model:visible="visible" header="Add new plant" position="bottom">
        <form class="space-y-7" @submit.prevent="onSubmit">
            <div class="space-y-5">
                <div class="flex flex-col space-y-2">
                    <label for="name-input">Name</label>
                    <InputText
                        id="name-input"
                        v-model.trim="plant.name"
                        type="text"
                        name="Name"
                        placeholder="Name of plant"
                    />
                    <small v-if="error" class="color-danger">{{ error }}</small>
                </div>

                <div class="flex flex-col space-y-2">
                    <label for="name-input">Area (optional)</label>
                    <AutoComplete
                        v-model.trim="plant.area"
                        :suggestions="filteredAreas"
                        fluid
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
                                placeholder="dd/mm/yyyy"
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
                <CustomButton type="submit">
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
import { AutoComplete, DatePicker, InputText } from 'primevue'
import { createPlant, updatePlant } from '@/models/plant'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import { useToast } from '@/composables/useToast'
import { usePlantsDrawer } from '@/composables/usePlantsDrawer'

const { isPlantsDrawerVisible: visible, plant, resetPlant } = usePlantsDrawer()

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

const error = ref('')

const onSubmit = async () => {
    error.value = ''

    if (!plant.name) {
        error.value = 'Plant name is required.'
        return
    }

    const otherPlants =
        (plant.id ? plants.value?.filter(({ id }) => id !== plant.id) : plants.value) ?? []
    if (otherPlants.some(({ name }) => name.toLowerCase() === plant.name.toLowerCase())) {
        error.value = 'Plant name is already being used'
        return
    }

    try {
        const validDatetimes = (plant.dates.filter(date => Boolean(date)) as Date[]).map(date =>
            date.getTime()
        )

        if (plant.id) {
            await updatePlant({
                ...plant,
                id: plant.id,
                datetimes: validDatetimes
            })
        } else {
            await createPlant({
                name: plant.name,
                datetimes: validDatetimes
            })
        }

        await invalidatePlantsQuery()

        visible.value = false
    } catch {
        displayGenericError()
    } finally {
        resetPlant()
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

watch(
    () => plant.area,
    value => {
        console.log(1, value)
    }
)
</script>
