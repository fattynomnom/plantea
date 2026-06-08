/**
 * Converts date text formatted with DD/MM/YYYY to a Date object.
 * @param text - Date text in DD/MM/YYYY format
 * @returns Date
 */
export const convertTextToDate = (text: string) => {
    const [day, month, year] = text.split('/')
    return new Date(`${month}/${day}/${year}`)
}
