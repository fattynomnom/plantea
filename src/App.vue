<template>
    <div
        :class="`dark:bg-gray-900 flex flex-col-reverse lg:flex-row h-full overflow-y-auto ${
            isDark ? 'dark' : ''
        } transition-colors`"
    >
        <div class="flex-1 lg:overflow-y-hidden">
            <RouterView />
        </div>

        <SideBar />

        <Toast :position="isLg ? 'bottom-left' : 'top-right'" />
    </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { RouterView } from 'vue-router'
import SideBar from '@/components/SideBar.vue'
import Toast from 'primevue/toast'
import { useBreakpoints } from './composables/useBreakpoints'

const isDark = useDark()

const { isLg } = useBreakpoints()
</script>
