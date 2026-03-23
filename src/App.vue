<template>
    <div class="flex flex-col-reverse lg:flex-row h-full overflow-y-auto transition-colors">
        <div class="flex-1 lg:overflow-y-hidden">
            <RouterView />
        </div>

        <Toast />
    </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth, signOut } from './modules/firebase'
import { useToast } from 'primevue'

const route = useRoute()
const router = useRouter()

const toast = useToast()

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
</script>
