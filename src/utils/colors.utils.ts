const colors = [
    'red',
    'orange',
    'amber',
    'lime',
    'green',
    'cyan',
    'blue',
    'indigo',
    'purple',
    'fuchsia',
    'pink',
    'rose'
]

export const getColorFromIndex = (index: number) => {
    const colorIndex = index >= colors.length ? Math.floor(index / colors.length) - 1 : index
    return colors[colorIndex < 0 ? 0 : colorIndex]
}
