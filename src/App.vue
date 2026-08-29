<template>
    <div class="flex flex-col h-screen overflow-y-hidden transition-colors">
        <div class="flex justify-between items-center p-7">
            <Logo class="h-10 w-10" />
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
        <ul>
            <li class="flex space-x-3 items-center" @click="onSignOutClick">
                <ArrowLeftStartOnRectangleIcon class="w-5 h-5" />
                <span>Sign out</span>
            </li>
        </ul>
    </CustomDrawer>

    <Toast />
</template>

<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth, signOut as signOutFirebase } from './modules/firebase'
import Logo from '@/assets/logo.svg?component'
import { ArrowLeftStartOnRectangleIcon, ArrowPathIcon, Bars3Icon } from '@heroicons/vue/24/outline'
import CustomDrawer from './components/CustomDrawer.vue'
import { ref } from 'vue'
import { useFirebaseUser } from './composables/useFirebaseUser'
import { useSetupsQuery } from './composables/useSetupsQuery'
import { useToast } from './composables/useToast'

const route = useRoute()
const router = useRouter()

const { displayGenericError, displayToast } = useToast()

const { user } = useFirebaseUser()

const { invalidateSetupsQuery } = useSetupsQuery()

const isMenuOpen = ref(false)

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
</script>
