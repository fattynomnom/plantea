import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useFirebaseUser } from './useFirebaseUser'
import { computed } from 'vue'
import { fetchSetups } from '@/models/setup'
import { usePlantsQuery } from './usePlantsQuery'

const setupsQueryKey = ['setups']

export const useSetupsQuery = () => {
    const { user } = useFirebaseUser()

    const { data: plants, invalidatePlantsQuery } = usePlantsQuery()

    const queryClient = useQueryClient()

    const { data, ...queryResults } = useQuery({
        queryKey: setupsQueryKey,
        enabled: computed(() => Boolean(user.value && plants.value)),
        queryFn: async () => {
            const setups = await fetchSetups()

            return setups.sort((a, b) => {
                if (a.area && b.area) {
                    const areaCmp = a.area.localeCompare(b.area)
                    if (areaCmp !== 0) {
                        return areaCmp
                    }
                }

                return a.id.localeCompare(b.id)
            })
        }
    })

    return {
        ...queryResults,
        data: computed(() =>
            data.value?.map(setup => ({
                ...setup,
                plants:
                    plants.value?.plantsWithSetup.filter(plant => plant.setup.id === setup.id) ?? []
            }))
        ),
        invalidateSetupsQuery: async () => {
            // invalidate and wait for plants query to load because this query is dependant on that query
            await invalidatePlantsQuery()
            queryClient.invalidateQueries({ queryKey: setupsQueryKey })
        }
    }
}
