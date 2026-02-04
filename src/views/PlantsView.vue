<template>
    <main class="relative h-full main-padding space-y-3">
        <div class="flex items-center justify-between px-2">
            <h2>Have you watered your plants?</h2>

            <div class="hidden sm:block">
                <CustomButton variant="link" @click="isDrawerVisible = true">
                    <PlusCircleIcon />
                    <span>Add plant setup</span>
                </CustomButton>
            </div>
        </div>

        <div
            :class="`rounded-2xl px-5 ${
                plants.length ? 'py-5' : 'py-16'
            } bg-gray-100 dark:bg-gray-800 shadow-lg flex flex-col justify-center space-y-10`"
        >
            <ul class="divide-y">
                <li
                    v-for="plant in plants"
                    :key="plant.id"
                    class="py-3 flex items-center justify-between"
                >
                    <div>
                        <span>{{ plant.name }}</span>
                        <span class="text-xs"> {{}} day(s) since last water </span>
                    </div>
                    <CustomButton
                        v-if="!plant.dateTimes.includes(todayTime)"
                        @click="onWaterClick(plant)"
                        >Watered</CustomButton
                    >
                </li>
            </ul>

            <div v-if="!plants.length" class="space-y-3 text-center">
                <h2 class="text-gray-500 dark:text-gray-400 font-bold">404 plants not found.</h2>
                <small class="font-normal dark:text-gray-400">
                    Add a plant setup to get started.
                </small>
            </div>

            <CustomButton variant="link" @click="isDrawerVisible = true">
                <PlusCircleIcon />
                <span>Add plant setup</span>
            </CustomButton>
        </div>

        <SignInDialog />

        <AddPlantsDrawer v-model:visible="isDrawerVisible" @submitted="fetchData" />
    </main>
</template>

<script setup lang="ts">
import { PlusCircleIcon } from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import SignInDialog from '@/components/SignInDialog.vue'
import { ref, watch } from 'vue'
import AddPlantsDrawer from '@/components/AddPlantsDrawer.vue'
import { fetchPlants, updatePlant, type Plant as PlantBase } from '@/models/plant'
import { useFirebaseUser } from '@/composables/useFirebaseUser'

interface Plant extends PlantBase {
    dateTimes: number[]
}

const { user } = useFirebaseUser()

const isDrawerVisible = ref(false)

const plants = ref<Plant[]>([])

const today = new Date()
today.setHours(0, 0, 0, 0)
const todayTime = today.getTime()

const fetchData = async () => {
    const data = await fetchPlants()
    plants.value = data.map(({ dates, ...plant }) => ({
        ...plant,
        dates,
        dateTimes: dates.map(date => date.getTime())
    }))
}

const onWaterClick = async (plant: Plant) =>
    updatePlant({ ...plant, dates: [...plant.dates, new Date()] })

watch(user, value => {
    if (value) {
        fetchData()
    }
})
</script>
