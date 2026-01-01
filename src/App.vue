<template>
  <div id="app">
    <a-config-provider :locale="zhCN">
      <div class="app-container">
        <h1>教育财务管理系统</h1>
        <p>项目初始化成功！</p>
        <a-button type="primary">Ant Design Vue 测试按钮</a-button>
      </div>
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
}

.app-container h1 {
  color: #1890ff;
  margin: 0;
}

.app-container p {
  color: #666;
  margin: 0;
}
</style>