import { useQuery } from '@tanstack/vue-query'
import { fetchPlants } from '@/models/plant'
import { useFirebaseUser } from './useFirebaseUser'
import { computed } from 'vue'

export const plantsQueryKey = ['plants']

export const usePlantsQuery = () => {
    const { user } = useFirebaseUser()

    return useQuery({
        queryKey: plantsQueryKey,
        enabled: computed(() => Boolean(user.value)),
        queryFn: fetchPlants
    })
}
