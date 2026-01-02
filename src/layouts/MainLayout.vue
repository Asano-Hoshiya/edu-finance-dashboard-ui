<template>
  <a-layout class="main-layout">
    <!-- 顶部导航栏 -->
    <NavBar />

    <!-- 主内容区域 -->
    <a-layout-content class="main-content">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import NavBar from '@/components/NavBar.vue';
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.main-content {
  margin-top: 64px;
  background-color: #f0f2f5;
}
</style>