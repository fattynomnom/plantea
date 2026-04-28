<template>
    <Drawer v-model:visible="visible" header="Future predictions" position="bottom">
        <form v-if="plantsToWater === undefined" class="space-y-7 pb-7" @submit.prevent="onSubmit">
            <DatePicker
                v-model="date"
                inline
                class="w-full"
                :min-date="dayjs().add(1, 'day').toDate()"
            />

            <div class="px-7">
                <CustomButton type="submit" :is-disabled="!date" class="w-full">
                    <SparklesIcon />
                    <span>Generate</span>
                </CustomButton>
            </div>
        </form>

        <div v-else class="space-y-5 pb-10 px-7">
            <h2>Plants to water on {{ dayjs(date).format('DD/MM/YYYY') }}</h2>

            <PlantCardList :plants="plantsToWater" />
        </div>
    </Drawer>
</template>

<script setup lang="ts">
import Drawer from 'primevue/drawer'
import CustomButton from '@/components/CustomButton.vue'
import { ref, watch } from 'vue'
import { SparklesIcon } from '@heroicons/vue/24/outline'
import { DatePicker } from 'primevue'
import dayjs from 'dayjs'
import { getPlantsToWaterOnDate, type Plant } from '@/models/plant'
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import { useToast } from '@/composables/useToast'
import PlantCardList from './PlantCardList.vue'

const visible = defineModel<boolean>('visible', { required: true })

const { data: plants } = usePlantsQuery()

const { displayGenericError } = useToast()

const date = ref<Date | null>(null)
const plantsToWater = ref<Plant[]>()

const onSubmit = () => {
    if (!date.value) {
        return
    }

    try {
        plantsToWater.value = getPlantsToWaterOnDate(plants.value ?? [], date.value)
    } catch (error) {
        console.log('Error generating predictions', error)
        displayGenericError()
    }
}

watch(visible, value => {
    if (!value) {
        date.value = null
        plantsToWater.value = []
    }
})
</script>
