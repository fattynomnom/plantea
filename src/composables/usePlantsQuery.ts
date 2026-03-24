import { useQuery } from '@tanstack/vue-query'
import { fetchPlants } from '@/models/plant'
import { useFirebaseUser } from './useFirebaseUser'
import { computed } from 'vue'

export const usePlantsQuery = () => {
    const { user } = useFirebaseUser()

    return useQuery({
        queryKey: ['plants'],
        enabled: computed(() => Boolean(user.value)),
        queryFn: fetchPlants
    })
}
