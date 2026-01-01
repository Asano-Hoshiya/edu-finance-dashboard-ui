// edu-finance-dashboard-ui/src/store/index.ts

import { createPinia } from 'pinia'
import type { Pinia } from 'pinia'

// 创建 Pinia 实例
const pinia: Pinia = createPinia()

// 导出 Pinia 实例供 main.ts 使用
export default pinia