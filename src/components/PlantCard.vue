<template>
    <div class="rounded-2xl py-3 px-4 flex flex-col">
        <div
            v-if="plant.frequencyDays || plant.isWateredToday || plant.shouldBeWatered"
            class="flex flex-wrap gap-2 mb-3"
        >
            <Chip
                v-if="plant.frequencyDays"
                :label="`Every ${plant.frequencyDays} days`"
                data-color="sky"
            >
                <template #icon>
                    <WaterDropletIcon />
                </template>
            </Chip>
            <Chip v-if="plant.isWateredToday" label="Watered" data-color="green">
                <template #icon>
                    <CheckCircleIcon />
                </template>
            </Chip>
            <Chip v-else-if="plant.shouldBeWatered" label="Water today" data-color="red">
                <template #icon>
                    <ExclamationCircleIcon />
                </template>
            </Chip>
            <Chip
                v-else-if="plant.frequencyDays"
                :label="`Next ${dayjs(plant.nextWateringDate).diff(undefined, 'days')} day`"
                data-color="gray"
            >
                <template #icon>
                    <FaucetIcon />
                </template>
            </Chip>
        </div>

        <div class="mb-4 flex-1">
            <slot />
        </div>

        <div class="grid grid-cols-2 gap-2">
            <CustomButton variant="outline" @click="$emit('edit')">Edit</CustomButton>
            <CustomButton
                :is-disabled="plant.isWateredToday"
                :is-loading="isWatering"
                @click="$emit('water')"
            >
                Water
            </CustomButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Plant } from '@/models/plant'
import dayjs from 'dayjs'
import { Chip } from 'primevue'
import WaterDropletIcon from '@/assets/icons/water-droplet.svg?component'
import FaucetIcon from '@/assets/icons/faucet-drip.svg?component'
import CustomButton from './CustomButton.vue'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid'

const { plant, isWatering } = defineProps<{
    plant: Pick<Plant, 'frequencyDays' | 'isWateredToday' | 'shouldBeWatered' | 'nextWateringDate'>
    isWatering: boolean
}>()

defineEmits<{
    (e: 'water'): Promise<void>
    (e: 'edit'): Promise<void>
}>()
</script>
