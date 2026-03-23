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
                        v-if="!plant.datetimes.includes(todayTime)"
                        @click="markPlantWatered(plant)"
                    >
                        Watered
                    </CustomButton>
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

            <CustomButton @click="signOut">
                <PlusCircleIcon />
                <span>Sign out</span>
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
import { fetchPlants, markPlantWatered, type Plant } from '@/models/plant'
import { useFirebaseUser } from '@/composables/useFirebaseUser'
import { signOut } from '@/modules/firebase'

const { user } = useFirebaseUser()

const isDrawerVisible = ref(false)

const plants = ref<Plant[]>([])

const today = new Date()
today.setHours(0, 0, 0, 0)
const todayTime = today.getTime()

const fetchData = async () => {
    plants.value = await fetchPlants()
}

watch(user, value => {
    if (value) {
        fetchData()
    }
})
</script>
