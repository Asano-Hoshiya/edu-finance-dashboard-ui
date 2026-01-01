import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import App from '@/App.vue'
import router from '@/router'

// 引入 Ant Design Vue 样式
import 'ant-design-vue/dist/reset.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 创建 Pinia 实例
const pinia = createPinia()

// 按顺序注册插件
app.use(router)
app.use(pinia)
app.use(Antd)

// 挂载应用到 DOM
app.mount('#app')