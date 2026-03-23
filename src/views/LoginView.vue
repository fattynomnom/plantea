<template>
    <div
        class="w-full h-full flex flex-col items-center justify-between px-10 py-16 bg-color-primary"
    >
        <div />

        <Logo class="h-48 w-48" />

        <CustomButton class="w-full" variant="accent" @click="displayPopup">
            <GoogleIcon />
            <span>Google sign in</span>
        </CustomButton>
    </div>
</template>

<script setup lang="ts">
import { authWithPopup } from '@/modules/firebase'
import GoogleIcon from '@/assets/icons/google.svg?component'
import Logo from '@/assets/logo.svg?component'
import { useToast } from '@/composables/useToast'
import CustomButton from '@/components/CustomButton.vue'
import { useRouter } from 'vue-router'

const { displayGenericError } = useToast()

const router = useRouter()

const displayPopup = async () => {
    try {
        await authWithPopup()
        router.push('/')
    } catch (error) {
        console.log(error)
        displayGenericError()
    }
}
</script>
