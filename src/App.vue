<template>
    <div
        :class="`dark:bg-gray-900 flex flex-col-reverse lg:flex-row h-full overflow-y-auto ${
            isDark ? 'dark' : ''
        } transition-colors`"
    >
        <div class="flex-1 lg:overflow-y-hidden">
            <PostLayout v-if="route.meta.template === 'PostLayout'" />
            <RouterView v-else />
        </div>

        <SideBar />

        <Toast :position="isLg ? 'bottom-left' : 'top-right'" />
    </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { RouterView, useRoute } from 'vue-router'
import PostLayout from '@/components/PostLayout.vue'
import SideBar from '@/components/SideBar.vue'
import Toast from 'primevue/toast'
import { useBreakpoints } from './composables/useBreakpoints'

const route = useRoute()

const isDark = useDark()

const { isLg } = useBreakpoints()
</script>
