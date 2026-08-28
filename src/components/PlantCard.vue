<template>
    <div class="rounded-2xl py-3 px-4">
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

        <div class="mb-4">
            <h3>{{ plant.name }} logs</h3>
            <ul v-if="plant.datetimes.length" class="grid grid-cols-2">
                <li
                    v-for="datetimes in plant.datetimes.slice(0, 10)"
                    :key="`${plant.id}-${datetimes}`"
                    class="tracking-wider text-sm"
                >
                    {{ dayjs(datetimes).format('DD/MM/YYYY') }}
                </li>
            </ul>
            <div v-else class="text-sm">No data recorded.</div>
        </div>

        <div class="grid grid-cols-2 gap-2">
            <CustomButton variant="outline" @click="$emit('edit')">Edit</CustomButton>
            <CustomButton :is-disabled="plant.isWateredToday" @click="$emit('water')">
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

const { plant } = defineProps<{
    plant: Pick<
        Plant,
        | 'frequencyDays'
        | 'isWateredToday'
        | 'shouldBeWatered'
        | 'nextWateringDate'
        | 'name'
        | 'datetimes'
        | 'id'
    >
}>()

defineEmits<{
    (e: 'water'): Promise<void>
    (e: 'edit'): Promise<void>
}>()
</script>
