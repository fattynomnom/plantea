<template>
    <AutoComplete
        v-model.trim="modelValue"
        :input-id="id"
        :suggestions="filteredAreas"
        fluid
        show-clear
        :placeholder="placeholder"
    />
</template>

<script setup lang="ts">
import { usePlantsQuery } from '@/composables/usePlantsQuery'
import { AutoComplete } from 'primevue'
import { computed } from 'vue'

const modelValue = defineModel<string | undefined>('modelValue')

const { placeholder, id } = defineProps<{
    placeholder?: string
    id?: string
}>()

const { data: plants } = usePlantsQuery()

const filteredAreas = computed(() => {
    if (!plants.value?.areas) {
        return []
    }

    const value = modelValue.value?.toLowerCase()
    if (value) {
        const areas = Object.keys(plants.value.areas)
        return areas.filter(area => area.toLowerCase().includes(value))
    }

    return []
})
</script>
