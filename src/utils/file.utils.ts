export const getFileExtension = (file: File): string => {
    const fromName = /\.([^.]+)$/.exec(file.name)?.[1]
    if (fromName) {
        return fromName.toLowerCase()
    }
    if (file.type?.includes('/')) {
        const subtype = file.type.split('/')[1]
        if (!subtype) {
            return 'bin'
        }
        if (subtype === 'jpeg') {
            return 'jpg'
        }
        return subtype.toLowerCase()
    }
    return 'bin'
}
