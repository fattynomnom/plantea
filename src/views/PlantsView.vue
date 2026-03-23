<template>
    <main class="h-full space-y-3">
        <div class="flex items-center justify-between px-2">
            <h2>Which plants have you watered today?</h2>

            <div class="hidden sm:block">
                <CustomButton variant="link" @click="isDrawerVisible = true">
                    <PlusCircleIcon />
                    <span>Add plant setup</span>
                </CustomButton>
            </div>
        </div>

        <ul v-if="hasPlants" class="grid grid-cols-2 gap-3">
            <li
                v-for="plant in plants"
                :key="plant.id"
                :class="{
                    'px-4 py-2 bg-white shadow-lg rounded-2xl': true,
                    'opacity-50': isPlantWatered(plant.datetimes)
                }"
                @click="markPlantWatered(plant)"
            >
                {{ plant.name }} {{ isPlantWatered(plant.datetimes) ? '(WATERED)' : '' }}
            </li>
        </ul>

        <div
            v-else
            class="rounded-2xl p-5 bg-white shadow-lg flex flex-col justify-center space-y-5"
        >
            <div class="space-y-3 text-center">
                <h2 class="text-gray-500 font-bold">404 plants not found.</h2>
                <small class="font-normal"> Add a plant to get started. </small>
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
import { computed, ref, watch } from 'vue'
import AddPlantsDrawer from '@/components/AddPlantsDrawer.vue'
import { fetchPlants, markPlantWatered, type Plant } from '@/models/plant'
import { useFirebaseUser } from '@/composables/useFirebaseUser'

const { user } = useFirebaseUser()

const isDrawerVisible = ref(false)

const plants = ref<Plant[]>([])

const hasPlants = computed(() => Boolean(plants.value.length))

const today = new Date()
today.setHours(0, 0, 0, 0)
const todayTime = today.getTime()

const fetchData = async () => {
    plants.value = await fetchPlants()
}

const isPlantWatered = (plantDates: number[]) => plantDates.includes(todayTime)

watch(user, value => {
    if (value) {
        fetchData()
    }
})
</script>
