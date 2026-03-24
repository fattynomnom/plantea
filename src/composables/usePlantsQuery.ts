import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchPlants } from '@/models/plant'
import { useFirebaseUser } from './useFirebaseUser'
import { computed } from 'vue'

const plantsQueryKey = ['plants']

export const usePlantsQuery = () => {
    const { user } = useFirebaseUser()

    const queryClient = useQueryClient()

    return {
        ...useQuery({
            queryKey: plantsQueryKey,
            enabled: computed(() => Boolean(user.value)),
            queryFn: fetchPlants
        }),
        invalidatePlantsQuery: () => queryClient.invalidateQueries({ queryKey: plantsQueryKey })
    }
}
