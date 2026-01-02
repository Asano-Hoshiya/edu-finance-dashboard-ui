<template>
  <a-layout-header class="navbar">
    <div class="navbar-container">
      <!-- 左侧：Logo + 站点标题 -->
      <div class="navbar-left">
        <router-link to="/" class="logo">
          <img src="@/assets/logo.svg" alt="Logo" class="logo-img" />
          <span class="site-title">教育财务管理系统</span>
        </router-link>
      </div>

      <!-- 右侧：导航菜单 + 用户信息 -->
      <div class="navbar-right">
        <template v-if="currentUser">
          <!-- 主导航菜单 -->
          <a-menu
            v-model:selectedKeys="selectedKeys"
            mode="horizontal"
            class="navbar-menu"
          >
            <!-- 首页 -->
            <a-menu-item key="home">
              <router-link to="/">
                <HomeOutlined />
                <span>首页</span>
              </router-link>
            </a-menu-item>

            <!-- 财务看板 -->
            <a-sub-menu key="dashboard">
              <template #title>
                <DashboardOutlined />
                <span>财务看板</span>
              </template>
              <a-menu-item key="finance-overview">
                <router-link to="/finance-overview">财务总览</router-link>
              </a-menu-item>
              <a-menu-item key="finance-trend" disabled>
                <span class="menu-placeholder">财务趋势</span>
                <a-tag color="orange" style="margin-left: 8px; font-size: 10px;">开发中</a-tag>
              </a-menu-item>
              <a-menu-item key="source-composition" disabled>
                <span class="menu-placeholder">来源构成</span>
                <a-tag color="orange" style="margin-left: 8px; font-size: 10px;">开发中</a-tag>
              </a-menu-item>
            </a-sub-menu>

            <!-- 财务明细 -->
            <a-sub-menu key="finance-details">
              <template #title>
                <FileTextOutlined />
                <span>财务明细</span>
              </template>
              <a-menu-item key="payment-details">
                <router-link to="/payment-details">缴费明细</router-link>
              </a-menu-item>
              <a-menu-item key="refund-details">
                <router-link to="/refund-details">退费明细</router-link>
              </a-menu-item>
              <a-menu-item key="pivot-table">
                <router-link to="/pivot-table">交叉统计表</router-link>
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="income-summary" disabled>
                <span class="menu-placeholder">收入汇总表</span>
                <a-tag color="orange" style="margin-left: 8px; font-size: 10px;">开发中</a-tag>
              </a-menu-item>
            </a-sub-menu>

            <!-- 班级管理 -->
            <a-sub-menu key="class">
              <template #title>
                <TeamOutlined />
                <span>班级管理</span>
              </template>
              <a-menu-item key="class-management">
                <router-link to="/class-management">班级经营看板</router-link>
              </a-menu-item>
              <a-menu-item key="class-income" disabled>
                <span class="menu-placeholder">班级收入统计</span>
                <a-tag color="orange" style="margin-left: 8px; font-size: 10px;">开发中</a-tag>
              </a-menu-item>
              <a-menu-item key="class-retention" disabled>
                <span class="menu-placeholder">班级留存分析</span>
                <a-tag color="orange" style="margin-left: 8px; font-size: 10px;">开发中</a-tag>
              </a-menu-item>
            </a-sub-menu>

            <!-- 教师绩效 -->
            <a-menu-item key="teacher-performance">
              <router-link to="/teacher-performance">
                <UserOutlined />
                <span>教师绩效</span>
              </router-link>
            </a-menu-item>

            <!-- 数据管理（占位） -->
            <a-sub-menu key="data-management">
              <template #title>
                <DatabaseOutlined />
                <span>数据管理</span>
              </template>
              <a-menu-item key="data-import" disabled>
                <UploadOutlined />
                <span class="menu-placeholder">数据导入</span>
                <a-tag color="orange" style="margin-left: 8px; font-size: 10px;">开发中</a-tag>
              </a-menu-item>
              <a-menu-item key="data-export" disabled>
                <DownloadOutlined />
                <span class="menu-placeholder">数据导出</span>
                <a-tag color="orange" style="margin-left: 8px; font-size: 10px;">开发中</a-tag>
              </a-menu-item>
              <a-menu-item key="template-download" disabled>
                <FileExcelOutlined />
                <span class="menu-placeholder">模板下载</span>
                <a-tag color="orange" style="margin-left: 8px; font-size: 10px;">开发中</a-tag>
              </a-menu-item>
            </a-sub-menu>
          </a-menu>

          <!-- 用户信息下拉菜单 -->
          <a-dropdown placement="bottomRight">
            <div class="user-info">
              <a-avatar :size="32" style="background-color: #1890ff">
                {{ currentUser.name?.charAt(0) || 'U' }}
              </a-avatar>
              <span class="user-name">{{ currentUser.name }}</span>
              <DownOutlined class="user-dropdown-icon" />
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item disabled>
                  <div class="user-detail">
                    <div class="user-detail-name">{{ currentUser.name }}</div>
                    <div class="user-detail-role">{{ getRoleName(currentUser.role) }}</div>
                    <div v-if="currentUser.campusName" class="user-detail-campus">
                      {{ currentUser.campusName }}
                    </div>
                  </div>
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="settings" disabled>
                  <SettingOutlined />
                  <span style="margin-left: 8px">系统设置</span>
                  <a-tag color="orange" style="margin-left: 8px; font-size: 10px;">开发中</a-tag>
                </a-menu-item>
                <a-menu-item @click="handleLogout">
                  <LogoutOutlined />
                  <span style="margin-left: 8px">退出登录</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>

        <!-- 未登录状态 -->
        <a-button v-else type="primary" @click="goToLogin">
          登录
        </a-button>
      </div>
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  HomeOutlined,
  DashboardOutlined,
  FundOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  DatabaseOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  SettingOutlined,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue';

// 用户信息类型
interface UserInfo {
  id: string;
  name: string;
  role: 'principal' | 'vice_principal' | 'teacher';
  campusId?: string;
  campusName?: string;
}

const router = useRouter();
const route = useRoute();

const selectedKeys = ref<string[]>([]);

// 从 localStorage 读取用户信息
const currentUser = computed<UserInfo | null>(() => {
  try {
    const stored = localStorage.getItem('userInfo');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
});

// 角色名称映射
const getRoleName = (role: string): string => {
  const roleMap: Record<string, string> = {
    principal: '校长',
    vice_principal: '分校长',
    teacher: '班主任',
  };
  return roleMap[role] || role;
};

// 根据当前路由设置选中菜单
const updateSelectedKeys = () => {
  const path = route.path;

  if (path === '/') {
    selectedKeys.value = ['home'];
  } else if (path === '/finance-overview') {
    selectedKeys.value = ['dashboard', 'finance-overview'];
  } else if (path === '/payment-details') {
    selectedKeys.value = ['finance-details', 'payment-details'];
  } else if (path === '/refund-details') {
    selectedKeys.value = ['finance-details', 'refund-details'];
  } else if (path === '/pivot-table') {
    selectedKeys.value = ['finance-details', 'pivot-table'];
  } else if (path === '/class-management') {
    selectedKeys.value = ['class', 'class-management'];
  } else if (path === '/teacher-performance') {
    selectedKeys.value = ['teacher-performance'];
  }
};

// 退出登录
const handleLogout = async () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    message.success('已退出登录');
    await router.push('/login');
  } catch (error) {
    message.error('退出失败，请重试');
  }
};

// 跳转登录
const goToLogin = () => {
  router.push('/login');
};

// 监听路由变化
watch(() => route.path, updateSelectedKeys, { immediate: true });
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0;
  height: 64px;
  line-height: 64px;
}

.navbar-container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.logo:hover {
  opacity: 0.85;
}

.logo-img {
  height: 36px;
  width: auto;
}

.site-title {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
  white-space: nowrap;
  user-select: none;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.navbar-menu {
  border-bottom: none;
  line-height: 62px;
  flex: 1;
}

.navbar-menu :deep(a) {
  color: inherit;
}

.navbar-menu :deep(.ant-menu-item-selected a),
.navbar-menu :deep(.ant-menu-submenu-selected > .ant-menu-submenu-title) {
  color: #1890ff;
}

.menu-placeholder {
  color: rgba(0, 0, 0, 0.45);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  user-select: none;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.user-name {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown-icon {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.user-detail {
  padding: 4px 0;
  min-width: 160px;
}

.user-detail-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.user-detail-role {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
}

.user-detail-campus {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  margin-top: 2px;
}

/* 响应式处理 */
@media (max-width: 1400px) {
  .navbar-menu :deep(.ant-menu-item),
  .navbar-menu :deep(.ant-menu-submenu-title) {
    padding: 0 12px;
  }
}

@media (max-width: 1200px) {
  .site-title {
    font-size: 16px;
  }
}

@media (max-width: 992px) {
  .navbar-container {
    padding: 0 16px;
  }

  .site-title {
    display: none;
  }
}

@media (max-width: 768px) {
  .user-name {
    display: none;
  }

  .logo-img {
    height: 28px;
  }
}
</style>