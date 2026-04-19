import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'

// Pinia 状态管理
const pinia = createPinia()

export function createApp() {
  const app = createSSRApp(App)
  app.use(pinia)
  return {
    app
  }
}
