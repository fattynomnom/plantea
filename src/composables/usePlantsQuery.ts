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
            queryFn: async () => {
                const plants = await fetchPlants()
                return plants.sort((a, b) => {
                    if (a.area && b.area) {
                        return a.area.localeCompare(b.area)
                    }

                    return a.name.localeCompare(b.name)
                })
            }
        }),
        invalidatePlantsQuery: () => queryClient.invalidateQueries({ queryKey: plantsQueryKey })
    }
}
