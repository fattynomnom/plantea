export const pluralize = (count: number, singular: string, plural: string) =>
    count > 1 ? `${count} ${plural}` : `${count} ${singular}`
