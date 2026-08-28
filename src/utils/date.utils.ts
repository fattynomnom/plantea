/**
 * Converts date text formatted with DD/MM/YYYY to a Date object.
 * @param text - Date text in DD/MM/YYYY format
 * @returns Date
 */
export const convertTextToDate = (text: string) => {
    const [day, month, year] = text.split('/')
    return new Date(`${month}/${day}/${year}`)
}

export const convertTextsToDates = (texts: Array<string | null>): Date[] =>
    texts.reduce<Date[]>((acc, dateText) => {
        const value = dateText?.trim()
        if (value) {
            return acc.concat(convertTextToDate(value))
        }

        return acc
    }, [])

export const convertTextsToDatetimes = (texts: Array<string | null>): number[] =>
    texts.reduce<number[]>((acc, dateText) => {
        const value = dateText?.trim()
        if (value) {
            const date = convertTextToDate(value)
            const datetime = date.getTime()
            return acc.concat(datetime)
        }

        return acc
    }, [])

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
