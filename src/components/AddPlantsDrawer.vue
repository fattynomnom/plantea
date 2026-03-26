<template>
    <Drawer v-model:visible="visible" header="Add new plant" position="bottom">
        <form class="space-y-7" @submit.prevent="onSubmit">
            <div class="space-y-5">
                <div class="flex flex-col space-y-2">
                    <label for="name-input">Name</label>
                    <InputText id="name-input" v-model.trim="plant.name" type="text" name="Name" />
                    <small v-if="error" class="text-red-900">{{ error }}</small>
                </div>

                <div v-if="plant.dates.length" class="flex flex-col space-y-2">
                    <label for="watering-date-inputs">Watering dates</label>
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
                    <span>Create</span>
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
import { reactive, ref, watch } from 'vue'
import { DatePicker, InputText } from 'primevue'
import { createPlant, type PlantInput as PlantModel } from '@/models/plant'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import { useToast } from '@/composables/useToast'

interface PlantInput extends Omit<PlantModel, 'datetimes'> {
    dates: Array<Date | null>
}

const visible = defineModel<boolean>('visible', { required: true })

const { data: plants, invalidatePlantsQuery } = usePlantsQuery()

const { displayGenericError } = useToast()

const plant = reactive<PlantInput>({
    name: '',
    dates: []
})

const error = ref('')

const onSubmit = async () => {
    error.value = ''

    if (!plant.name) {
        error.value = 'Plant name is required.'
        return
    }

    if (plants.value?.some(({ name }) => name === plant.name)) {
        error.value = 'Plant name is already being used'
        return
    }

    try {
        await createPlant({
            name: plant.name,
            datetimes: (plant.dates.filter(date => Boolean(date)) as Date[]).map(date =>
                date.getTime()
            )
        })
        await invalidatePlantsQuery()
        visible.value = false
    } catch {
        displayGenericError()
    } finally {
        plant.name = ''
        plant.dates = []
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
