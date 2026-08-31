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
import { useAreas } from '@/composables/useAreas'
import { AutoComplete } from 'primevue'
import { computed } from 'vue'

const modelValue = defineModel<string | undefined>('modelValue')

const { placeholder, id } = defineProps<{
    placeholder?: string
    id?: string
}>()

const { areas } = useAreas()

const filteredAreas = computed(() => {
    const value = modelValue.value?.toLowerCase()
    if (value) {
        return areas.value.filter(area => area.toLowerCase().includes(value))
    }

    return []
})
</script>
