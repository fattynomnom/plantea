import { useQuery } from '@tanstack/vue-query'
import { fetchPlants } from '@/models/plant'

export const usePlantsQuery = () =>
    useQuery({
        queryKey: ['plants'],
        queryFn: fetchPlants
    })
