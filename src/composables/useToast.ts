import { useToast as usePrimeVueToast } from 'primevue'

export const useToast = () => {
    const toast = usePrimeVueToast()

    const displayGenericError = () => {
        toast.add({
            severity: 'error',
            summary: 'Something went wrong',
            detail: 'An error occurred while processing your request. Please try again later.'
        })
    }

    return { displayGenericError }
}
