import { breakpointsTailwind, useBreakpoints as useVueuseBreakpoints } from '@vueuse/core'

export const useBreakpoints = () => {
    const breakpoint = useVueuseBreakpoints(breakpointsTailwind)

    return {
        isXs: breakpoint.smaller('sm'),
        isSm: breakpoint.greaterOrEqual('sm'),
        isMd: breakpoint.greaterOrEqual('md'),
        isLg: breakpoint.greaterOrEqual('lg'),
        isXl: breakpoint.greaterOrEqual('xl'),
        is2xl: breakpoint.greaterOrEqual('2xl')
    }
}
