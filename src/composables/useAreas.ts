import { computed } from 'vue'
import { usePlantsQuery } from './usePlantsQuery'
import { useSetupsQuery } from './useSetupsQuery'

export const useAreas = () => {
    const { data: plants } = usePlantsQuery()
    const { data: setups } = useSetupsQuery()

    const areaPlantsCountMap = computed<Record<string, number>>(() => {
        if (!plants.value || !setups.value) {
            return {}
        }

        const singlePlantsAreasMap = plants.value.singlePlants.reduce<Record<string, number>>(
            (acc, { area }) => {
                const value = area?.trim()
                if (value) {
                    acc[value] = (acc[value] ?? 0) + 1
                }
                return acc
            },
            {}
        )

        return setups.value.reduce<Record<string, number>>((acc, { area, plants }) => {
            const value = area?.trim()
            if (value) {
                acc[value] = (acc[value] ?? 0) + plants.length
            }
            return acc
        }, singlePlantsAreasMap)
    }, {})

    const areas = computed<string[]>(() => Object.keys(areaPlantsCountMap))

    return { areaPlantsCountMap, areas }
}
