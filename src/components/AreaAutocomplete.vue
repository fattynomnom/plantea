<template>
    <AutoComplete
        v-model.trim="modelValue"
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

const { placeholder } = defineProps<{
    placeholder?: string
}>()

const { data: plants } = usePlantsQuery()

const filteredAreas = computed(() => {
    const value = modelValue.value?.toLowerCase()
    return (
        (value
            ? plants.value?.areas.filter(area => area.toLowerCase().includes(value))
            : plants.value?.areas) ?? []
    )
})
</script>
