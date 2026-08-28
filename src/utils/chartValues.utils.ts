import type { ChartValues } from '@/types'

export const calculatePosition = (
    positionPercentage: ChartValues,
    { width, height }: { width?: number; height?: number }
): ChartValues | undefined => {
    if (width && height) {
        return {
            x: (width * positionPercentage.x) / 100,
            y: (height * positionPercentage.y) / 100
        }
    }

    return undefined
}
