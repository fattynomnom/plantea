<template>
    <div class="flex flex-col h-screen overflow-y-hidden transition-colors">
        <div class="flex justify-between items-center p-7">
            <Logo class="h-10 w-10" />
            <Bars3Icon v-if="user" class="h-5 w-5" @click="isMenuOpen = true" />
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
import { firebaseAuth, signOut } from './modules/firebase'
import { useToast } from 'primevue'
import Logo from '@/assets/logo.svg?component'
import { ArrowLeftStartOnRectangleIcon, Bars3Icon } from '@heroicons/vue/24/outline'
import CustomDrawer from './components/CustomDrawer.vue'
import { ref } from 'vue'
import { useFirebaseUser } from './composables/useFirebaseUser'

const route = useRoute()
const router = useRouter()

const toast = useToast()

const { user } = useFirebaseUser()

const isMenuOpen = ref(false)

onAuthStateChanged(firebaseAuth, fbUser => {
    const goToLogin = () => {
        if (route.name !== 'login') {
            router.push('/login')
        }
    }

    if (!fbUser) {
        goToLogin()
    } else if (fbUser.email !== import.meta.env.VITE_ALLOWED_EMAIL) {
        toast.add({
            severity: 'error',
            summary: 'Forbidden',
            detail: 'Email is not whitelisted.',
            life: 10000
        })

        signOut()
        goToLogin()
    } else if (route.name === 'login') {
        router.replace('/')
    }
})

const onSignOutClick = async () => {
    await signOut()
    isMenuOpen.value = false
}
</script>
