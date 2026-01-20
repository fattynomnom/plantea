import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import { ToastService } from 'primevue'
import Lara from '@primeuix/themes/lara'
import Tooltip from 'primevue/tooltip'

const app = createApp(App)

app.use(router)
    .use(PrimeVue, {
        theme: {
            preset: Lara
        }
    })
    .use(ToastService)
    .directive('tooltip', Tooltip)

app.mount('#app')
