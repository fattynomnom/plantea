import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchAndPurgePlants, type Plant } from '@/models/plant'
import { useFirebaseUser } from './useFirebaseUser'
import { computed } from 'vue'

const plantsQueryKey = ['plants']

type SinglePlant = Omit<Plant, 'setup'>

export type PlantWithSetup = Omit<Plant, 'setup' | 'area'> & Required<Pick<Plant, 'setup'>>

interface Data {
    singlePlants: SinglePlant[]
    plantsWithSetup: PlantWithSetup[]
}

export const usePlantsQuery = () => {
    const { user } = useFirebaseUser()

    const queryClient = useQueryClient()

    return {
        ...useQuery({
            queryKey: plantsQueryKey,
            enabled: computed(() => Boolean(user.value)),
            queryFn: async () => {
                const plants = await fetchAndPurgePlants()

                const { singlePlants, plantsWithSetup } = plants.reduce<Data>(
                    (acc, { setup, ...plant }) => ({
                        singlePlants: setup ? acc.singlePlants : acc.singlePlants.concat(plant),
                        plantsWithSetup: setup
                            ? acc.plantsWithSetup.concat({ ...plant, setup })
                            : acc.plantsWithSetup
                    }),
                    { singlePlants: [], plantsWithSetup: [] }
                )

                singlePlants.sort((a, b) => {
                    if (a.area && b.area) {
                        const areaCmp = a.area.localeCompare(b.area)
                        if (areaCmp !== 0) {
                            return areaCmp
                        }
                    }

                    return a.name.localeCompare(b.name)
                })

                return {
                    singlePlants,
                    plantsWithSetup
                }
            }
        }),
        invalidatePlantsQuery: () => queryClient.invalidateQueries({ queryKey: plantsQueryKey })
    }
}
