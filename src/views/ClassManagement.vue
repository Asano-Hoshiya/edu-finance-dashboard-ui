<template>
  <div class="class-management">
    <div class="page-header">
      <h2>班级管理</h2>
      <a-space>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索班级名称"
          style="width: 200px"
          @search="handleSearch"
        />
        <a-select
          v-model:value="statusFilter"
          placeholder="班级状态"
          style="width: 120px"
          allowClear
        >
          <a-select-option value="active">进行中</a-select-option>
          <a-select-option value="pending">待开班</a-select-option>
          <a-select-option value="finished">已结课</a-select-option>
        </a-select>
        <a-button type="primary" @click="showAddModal">
          <template #icon><PlusOutlined /></template>
          新增班级
        </a-button>
      </a-space>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" class="stats-section">
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="班级总数" :value="statistics.total" suffix="个" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="进行中" :value="statistics.active" suffix="个" :value-style="{ color: '#52c41a' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="学生总数" :value="statistics.students" suffix="人" :value-style="{ color: '#1890ff' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="本月收入" :value="statistics.revenue" prefix="¥" :value-style="{ color: '#722ed1' }" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 班级列表 -->
    <a-card title="班级列表" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="viewDetail(record)">{{ record.name }}</a>
          </template>
          <template v-if="column.key === 'teacher'">
            <a-avatar size="small" :style="{ backgroundColor: '#1890ff', marginRight: '8px' }">
              {{ record.teacher.charAt(0) }}
            </a-avatar>
            {{ record.teacher }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'progress'">
            <a-progress
              :percent="record.progress"
              :status="record.progress === 100 ? 'success' : 'active'"
              size="small"
              style="width: 100px"
            />
          </template>
          <template v-if="column.key === 'revenue'">
            <span style="color: #52c41a">¥{{ record.revenue.toLocaleString() }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
              <a-button type="link" size="small" @click="editClass(record)">编辑</a-button>
              <a-popconfirm
                title="确定要删除该班级吗？"
                @confirm="deleteClass(record)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        :model="formState"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="班级名称" required>
          <a-input v-model:value="formState.name" placeholder="请输入班级名称" />
        </a-form-item>
        <a-form-item label="授课老师" required>
          <a-select v-model:value="formState.teacher" placeholder="请选择授课老师">
            <a-select-option value="张老师">张老师</a-select-option>
            <a-select-option value="李老师">李老师</a-select-option>
            <a-select-option value="王老师">王老师</a-select-option>
            <a-select-option value="赵老师">赵老师</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="班级类型">
          <a-select v-model:value="formState.type" placeholder="请选择班级类型">
            <a-select-option value="regular">常规班</a-select-option>
            <a-select-option value="intensive">强化班</a-select-option>
            <a-select-option value="vip">VIP班</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="开班日期">
          <a-date-picker v-model:value="formState.startDate" style="width: 100%" />
        </a-form-item>
        <a-form-item label="班级人数">
          <a-input-number v-model:value="formState.capacity" :min="1" :max="100" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { TablePaginationConfig } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'

interface ClassItem {
  id: number
  name: string
  teacher: string
  type: string
  students: number
  capacity: number
  status: string
  progress: number
  revenue: number
  startDate: string
  endDate: string
}

interface FormState {
  name: string
  teacher: string
  type: string
  startDate: Dayjs | null
  capacity: number
}

// 搜索和筛选
const searchText = ref('')
const statusFilter = ref<string | undefined>(undefined)
const loading = ref(false)

// 统计数据
const statistics = reactive({
  total: 24,
  active: 18,
  students: 486,
  revenue: 628500
})

// 分页配置
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 24,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 表格列定义
const columns = [
  { title: '班级名称', dataIndex: 'name', key: 'name' },
  { title: '授课老师', dataIndex: 'teacher', key: 'teacher' },
  { title: '班级类型', dataIndex: 'type', key: 'type' },
  { title: '学生人数', dataIndex: 'students', key: 'students' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '进度', dataIndex: 'progress', key: 'progress' },
  { title: '收入', dataIndex: 'revenue', key: 'revenue' },
  { title: '操作', key: 'action', width: 180 }
]

// Mock 班级数据
const classData = ref<ClassItem[]>([
  { id: 1, name: '高三数学冲刺班A', teacher: '张老师', type: '强化班', students: 25, capacity: 30, status: 'active', progress: 65, revenue: 80000, startDate: '2024-01-01', endDate: '2024-06-30' },
  { id: 2, name: '初二英语提高班', teacher: '李老师', type: '常规班', students: 20, capacity: 25, status: 'active', progress: 45, revenue: 48000, startDate: '2024-02-15', endDate: '2024-07-15' },
  { id: 3, name: '小学奥数基础班', teacher: '王老师', type: '常规班', students: 18, capacity: 20, status: 'active', progress: 80, revenue: 36000, startDate: '2023-09-01', endDate: '2024-01-31' },
  { id: 4, name: '高一物理VIP班', teacher: '赵老师', type: 'VIP班', students: 8, capacity: 10, status: 'active', progress: 30, revenue: 64000, startDate: '2024-03-01', endDate: '2024-08-31' },
  { id: 5, name: '中考语文冲刺班', teacher: '张老师', type: '强化班', students: 22, capacity: 25, status: 'pending', progress: 0, revenue: 0, startDate: '2024-04-01', endDate: '2024-06-15' },
  { id: 6, name: '高二化学提高班', teacher: '李老师', type: '常规班', students: 15, capacity: 20, status: 'finished', progress: 100, revenue: 45000, startDate: '2023-07-01', endDate: '2023-12-31' }
])

// 筛选后的数据
const filteredData = computed(() => {
  return classData.value.filter(item => {
    const matchSearch = !searchText.value || item.name.includes(searchText.value)
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

// 弹窗相关
const modalVisible = ref(false)
const modalTitle = ref('新增班级')
const editingId = ref<number | null>(null)
const formState = reactive<FormState>({
  name: '',
  teacher: '',
  type: 'regular',
  startDate: null,
  capacity: 20
})

// 状态颜色映射
const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    active: 'green',
    pending: 'orange',
    finished: 'default'
  }
  return map[status] || 'default'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    active: '进行中',
    pending: '待开班',
    finished: '已结课'
  }
  return map[status] || status
}

// 事件处理
const handleSearch = () => {
  message.info(`搜索: ${searchText.value}`)
}

const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

const showAddModal = () => {
  modalTitle.value = '新增班级'
  editingId.value = null
  Object.assign(formState, {
    name: '',
    teacher: '',
    type: 'regular',
    startDate: null,
    capacity: 20
  })
  modalVisible.value = true
}

const viewDetail = (record: ClassItem) => {
  message.info(`查看班级详情: ${record.name}`)
}

const editClass = (record: ClassItem) => {
  modalTitle.value = '编辑班级'
  editingId.value = record.id
  Object.assign(formState, {
    name: record.name,
    teacher: record.teacher,
    type: record.type,
    startDate: null,
    capacity: record.capacity
  })
  modalVisible.value = true
}

const deleteClass = (record: ClassItem) => {
  classData.value = classData.value.filter(item => item.id !== record.id)
  message.success(`已删除班级: ${record.name}`)
}

const handleModalOk = () => {
  if (!formState.name || !formState.teacher) {
    message.error('请填写必填项')
    return
  }

  if (editingId.value) {
    message.success('班级信息已更新')
  } else {
    message.success('班级添加成功')
  }
  modalVisible.value = false
}

const handleModalCancel = () => {
  modalVisible.value = false
}
</script>

<style scoped lang="less">
.class-management {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.stats-section {
  margin-bottom: 16px;
}
</style>