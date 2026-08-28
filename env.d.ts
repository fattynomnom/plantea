/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />

import 'vue-router'

declare module 'vue-router' {
    interface RouteMeta {
        title?: string
        appearTransition?: string
    }
}

declare global {
    interface Window {
        __TANSTACK_QUERY_CLIENT__: import('@tanstack/query-core').QueryClient
    }
}
