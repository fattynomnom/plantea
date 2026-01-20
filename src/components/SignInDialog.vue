<template>
    <div
        v-if="user === null"
        class="absolute top-0 left-0 w-full h-full animate-enter animate-leave"
    >
        <div
            class="absolute left-1/4 top-1/4 z-10 rounded-2xl bg-gray-100 dark:bg-gray-950 w-1/2 p-7 shadow-lg flex flex-col space-y-5 my-7"
        >
            <div class="space-y-2">
                <h2>Sign in with Google</h2>
                <div class="font-normal text-sm">
                    Clicking this button will open a new tab, make sure to disable any popup
                    blocker.
                </div>
            </div>

            <CustomButton v-on:click="displayPopup">
                <GoogleIcon />
                <span>Google sign in</span>
            </CustomButton>
        </div>
        <div class="w-full h-full bg-gray-100/30 dark:bg-gray-900/60 backdrop-blur-sm" />
    </div>
</template>

<script setup lang="ts">
import CustomButton from './CustomButton.vue'
import GoogleIcon from '@/assets/icons/google.svg?component'
import { useFirebaseUser } from '@/composables/useFirebaseUser'
import { authWithPopup } from '@/modules/firebase'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const { user } = useFirebaseUser()

const displayPopup = async () => {
    try {
        const result = await authWithPopup()
        console.log(1, result)
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Something went wrong',
            detail: 'An error occurred while processing your request. Please try again later.'
        })
    }
}
</script>
