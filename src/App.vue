<template>
    <div class="flex flex-col-reverse lg:flex-row h-full overflow-y-auto transition-colors">
        <div class="flex-1 lg:overflow-y-hidden">
            <RouterView />
        </div>

        <Toast :position="isLg ? 'bottom-left' : 'top-right'" />
    </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import { useBreakpoints } from './composables/useBreakpoints'

const { isLg } = useBreakpoints()
</script>
