import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'

// 全局样式（包含所有SCSS变量）
import './styles/global.scss'

// Pinia 状态管理
const pinia = createPinia()

export function createApp() {
  const app = createSSRApp(App)
  app.use(pinia)
  return {
    app
  }
}
