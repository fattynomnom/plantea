<template>
    <div class="flex flex-col h-screen overflow-y-hidden transition-colors">
        <div class="flex justify-between items-center p-7">
            <Logo class="h-10 w-10" @click="router.push('/')" />
            <div class="flex space-x-4">
                <ArrowPathIcon
                    :class="{
                        'h-5 w-5': true,
                        'opacity-50': isRefreshing
                    }"
                    @click="onRefreshClick"
                />
                <Bars3Icon v-if="user" class="h-5 w-5" @click="isMenuOpen = true" />
            </div>
        </div>

        <div class="flex-1 flex flex-col overflow-y-hidden">
            <RouterView />
        </div>
    </div>

    <CustomDrawer v-model:visible="isMenuOpen">
        <ul class="menu-list space-y-4">
            <li @click="onSignOutClick">
                <ArrowLeftStartOnRectangleIcon />
                <span>Sign out</span>
            </li>
            <li @click="onAddPlantClick">
                <PlusIcon />
                <span>Add plant</span>
            </li>
            <li @click="onAddSetupClick">
                <PlusIcon />
                <span>Add setup</span>
            </li>
            <li @click="onGenPredictionsClick">
                <SparklesIcon />
                <span>Generate future predictions</span>
            </li>
        </ul>
    </CustomDrawer>

    <Toast />

    <PredictionDrawer v-model:visible="isPredictionOpen" />
</template>

<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth, signOut as signOutFirebase } from './modules/firebase'
import Logo from '@/assets/logo.svg?component'
import {
    ArrowLeftStartOnRectangleIcon,
    ArrowPathIcon,
    Bars3Icon,
    PlusIcon,
    SparklesIcon
} from '@heroicons/vue/24/solid'
import CustomDrawer from './components/CustomDrawer.vue'
import { ref } from 'vue'
import { useFirebaseUser } from './composables/useFirebaseUser'
import { useSetupsQuery } from './composables/useSetupsQuery'
import { useToast } from './composables/useToast'
import { usePlantsDrawer } from './composables/usePlantsDrawer'
import PredictionDrawer from './components/PredictionDrawer.vue'

const route = useRoute()
const router = useRouter()

const { displayGenericError, displayToast } = useToast()

const { user } = useFirebaseUser()

const { invalidateSetupsQuery } = useSetupsQuery()

const { openCreateDrawer } = usePlantsDrawer()

const isMenuOpen = ref(false)
const isPredictionOpen = ref(false)

onAuthStateChanged(firebaseAuth, async fbUser => {
    const goToLogin = () => {
        if (route.name !== 'login') {
            router.push('/login')
        }
    }

    const allowedEmails = import.meta.env.VITE_ALLOWED_EMAILS.split(',')

    if (!fbUser) {
        goToLogin()
    } else if (!allowedEmails.includes(fbUser.email)) {
        displayToast({
            severity: 'error',
            summary: 'Forbidden',
            detail: 'Email is not whitelisted.',
            life: 10000
        })

        signOut()
        goToLogin()
    } else if (route.name === 'login') {
        await invalidateSetupsQuery()
        router.replace('/')
    }
})

const onSignOutClick = async () => {
    await signOut()
    isMenuOpen.value = false
}

const signOut = async () => {
    await invalidateSetupsQuery()
    signOutFirebase()
}

// #region refresh
const isRefreshing = ref(false)

const onRefreshClick = async () => {
    isRefreshing.value = true

    try {
        await invalidateSetupsQuery()
        displayToast({
            severity: 'success',
            summary: 'Data refreshed',
            life: 3000
        })
    } catch {
        displayGenericError()
    } finally {
        isRefreshing.value = false
    }
}
// #endregion

// #region menu
const onAddPlantClick = () => {
    isMenuOpen.value = false
    openCreateDrawer()
}

const onAddSetupClick = () => {
    isMenuOpen.value = false
    router.push('/create')
}

const onGenPredictionsClick = () => {
    isMenuOpen.value = false
    isPredictionOpen.value = true
}
// #endregion
</script>

<style scoped>
.menu-list > li {
    font-family: var(--font-accent);
    @apply flex space-x-3 items-center font-bold;
}

.menu-list > li svg {
    @apply w-5 h-5;
}
</style>
