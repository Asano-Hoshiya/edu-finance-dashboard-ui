<template>
  <div class="teacher-performance">
    <div class="page-header">
      <h2>教师绩效</h2>
      <a-space>
        <a-select
          v-model:value="selectedMonth"
          style="width: 120px"
        >
          <a-select-option v-for="month in monthOptions" :key="month" :value="month">
            {{ month }}
          </a-select-option>
        </a-select>
        <a-button @click="handleExport">
          <template #icon><ExportOutlined /></template>
          导出报表
        </a-button>
      </a-space>
    </div>

    <!-- 绩效概览 -->
    <a-row :gutter="[16, 16]" class="overview-section">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card>
          <a-statistic title="教师总数" :value="28" suffix="人">
            <template #prefix><TeamOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card>
          <a-statistic title="本月课时总计" :value="1256" suffix="课时" :value-style="{ color: '#1890ff' }">
            <template #prefix><ClockCircleOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card>
          <a-statistic title="平均满意度" :value="4.6" suffix="分" :value-style="{ color: '#52c41a' }">
            <template #prefix><StarOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card>
          <a-statistic title="本月绩效奖金" prefix="¥" :value="186500" :value-style="{ color: '#722ed1' }">
            <template #prefix><DollarOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表区域 -->
    <a-row :gutter="[16, 16]" class="chart-section">
      <a-col :xs="24" :lg="12">
        <a-card title="教师课时排名 TOP10" :bordered="false">
          <div ref="barChartRef" class="chart-container"></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="满意度分布" :bordered="false">
          <div ref="radarChartRef" class="chart-container"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 教师绩效表格 -->
    <a-card title="教师绩效明细" :bordered="false">
      <template #extra>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索教师姓名"
          style="width: 200px"
        />
      </template>

      <a-table
        :columns="columns"
        :data-source="filteredTeachers"
        :pagination="{ pageSize: 10, showSizeChanger: true }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a-space>
              <a-avatar :style="{ backgroundColor: getAvatarColor(record.id) }">
                {{ record.name.charAt(0) }}
              </a-avatar>
              <span>{{ record.name }}</span>
            </a-space>
          </template>
          <template v-if="column.key === 'rating'">
            <a-rate :value="record.rating" disabled allow-half />
            <span style="margin-left: 8px">{{ record.rating }}</span>
          </template>
          <template v-if="column.key === 'performance'">
            <a-progress
              :percent="record.performance"
              :status="record.performance >= 80 ? 'success' : record.performance >= 60 ? 'normal' : 'exception'"
              size="small"
              style="width: 120px"
            />
          </template>
          <template v-if="column.key === 'bonus'">
            <span style="color: #52c41a; font-weight: 500">¥{{ record.bonus.toLocaleString() }}</span>
          </template>
          <template v-if="column.key === 'trend'">
            <span :class="['trend', record.trend >= 0 ? 'up' : 'down']">
              <ArrowUpOutlined v-if="record.trend >= 0" />
              <ArrowDownOutlined v-else />
              {{ Math.abs(record.trend) }}%
            </span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
              <a-button type="link" size="small" @click="adjustBonus(record)">调整</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  ExportOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons-vue'
import * as echarts from 'echarts'

interface Teacher {
  id: number
  name: string
  subject: string
  classes: number
  hours: number
  students: number
  rating: number
  performance: number
  bonus: number
  trend: number
}

// 筛选条件
const selectedMonth = ref('2024年1月')
const searchText = ref('')
const monthOptions = ['2024年1月', '2023年12月', '2023年11月', '2023年10月']

// 图表 refs
const barChartRef = ref<HTMLElement | null>(null)
const radarChartRef = ref<HTMLElement | null>(null)
let barChart: echarts.ECharts | null = null
let radarChart: echarts.ECharts | null = null

// 表格列定义
const columns = [
  { title: '教师', dataIndex: 'name', key: 'name' },
  { title: '科目', dataIndex: 'subject', key: 'subject' },
  { title: '班级数', dataIndex: 'classes', key: 'classes' },
  { title: '课时', dataIndex: 'hours', key: 'hours' },
  { title: '学生数', dataIndex: 'students', key: 'students' },
  { title: '评分', dataIndex: 'rating', key: 'rating', width: 180 },
  { title: '绩效', dataIndex: 'performance', key: 'performance', width: 150 },
  { title: '奖金', dataIndex: 'bonus', key: 'bonus' },
  { title: '环比', dataIndex: 'trend', key: 'trend' },
  { title: '操作', key: 'action', width: 120 }
]

// Mock 教师数据
const teacherData = ref<Teacher[]>([
  { id: 1, name: '张明华', subject: '数学', classes: 5, hours: 68, students: 125, rating: 4.8, performance: 95, bonus: 12800, trend: 8.5 },
  { id: 2, name: '李晓红', subject: '英语', classes: 4, hours: 56, students: 98, rating: 4.6, performance: 88, bonus: 9600, trend: 3.2 },
  { id: 3, name: '王建国', subject: '物理', classes: 3, hours: 48, students: 72, rating: 4.5, performance: 82, bonus: 8200, trend: -2.1 },
  { id: 4, name: '赵丽萍', subject: '化学', classes: 4, hours: 52, students: 88, rating: 4.7, performance: 90, bonus: 10500, trend: 5.8 },
  { id: 5, name: '陈志强', subject: '语文', classes: 3, hours: 45, students: 68, rating: 4.4, performance: 78, bonus: 7500, trend: 1.2 },
  { id: 6, name: '刘美芳', subject: '生物', classes: 2, hours: 32, students: 45, rating: 4.3, performance: 75, bonus: 6200, trend: -1.5 },
  { id: 7, name: '杨文杰', subject: '历史', classes: 2, hours: 28, students: 38, rating: 4.2, performance: 72, bonus: 5800, trend: 0.8 },
  { id: 8, name: '周小燕', subject: '地理', classes: 2, hours: 30, students: 42, rating: 4.5, performance: 80, bonus: 6500, trend: 4.2 }
])

// 筛选后的数据
const filteredTeachers = computed(() => {
  if (!searchText.value) return teacherData.value
  return teacherData.value.filter(t => t.name.includes(searchText.value))
})

// 头像颜色
const getAvatarColor = (id: number) => {
  const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff']
  return colors[id % colors.length]
}

// 初始化柱状图
const initBarChart = () => {
  if (!barChartRef.value) return

  barChart = echarts.init(barChartRef.value)
  const sortedData = [...teacherData.value].sort((a, b) => b.hours - a.hours).slice(0, 10)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '课时'
    },
    yAxis: {
      type: 'category',
      data: sortedData.map(t => t.name).reverse()
    },
    series: [
      {
        name: '课时',
        type: 'bar',
        data: sortedData.map(t => t.hours).reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: '#36cfc9' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}课时'
        }
      }
    ]
  }
  barChart.setOption(option)
}

// 初始化雷达图
const initRadarChart = () => {
  if (!radarChartRef.value) return

  radarChart = echarts.init(radarChartRef.value)
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: ['张明华', '李晓红', '赵丽萍'],
      bottom: 0
    },
    radar: {
      indicator: [
        { name: '课时量', max: 100 },
        { name: '学生评价', max: 5 },
        { name: '教学效果', max: 100 },
        { name: '出勤率', max: 100 },
        { name: '团队协作', max: 100 }
      ],
      radius: '60%'
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [85, 4.8, 92, 98, 88],
            name: '张明华',
            itemStyle: { color: '#1890ff' }
          },
          {
            value: [72, 4.6, 85, 95, 90],
            name: '李晓红',
            itemStyle: { color: '#52c41a' }
          },
          {
            value: [78, 4.7, 88, 96, 85],
            name: '赵丽萍',
            itemStyle: { color: '#722ed1' }
          }
        ]
      }
    ]
  }
  radarChart.setOption(option)
}

// 事件处理
const handleExport = () => {
  message.success('报表导出中...')
}

const viewDetail = (record: Teacher) => {
  message.info(`查看 ${record.name} 的详细绩效`)
}

const adjustBonus = (record: Teacher) => {
  message.info(`调整 ${record.name} 的绩效奖金`)
}

// 窗口 resize 处理
const handleResize = () => {
  barChart?.resize()
  radarChart?.resize()
}

onMounted(() => {
  initBarChart()
  initRadarChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  barChart?.dispose()
  radarChart?.dispose()
})
</script>

<style scoped lang="less">
.teacher-performance {
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

.overview-section {
  margin-bottom: 16px;
}

.chart-section {
  margin-bottom: 16px;

  .chart-container {
    height: 320px;
  }
}

.trend {
  &.up {
    color: #52c41a;
  }
  &.down {
    color: #ff4d4f;
  }
}
</style>