<template>
  <div class="class-rank-container">
    <h3 class="section-title">班级收入排行榜</h3>
    <div class="filter-bar">
      <button
        v-for="filter in filters"
        :key="filter.value"
        class="filter-btn"
        :class="{ active: currentFilter === filter.value }"
        @click="currentFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>
    <div class="table-wrapper">
      <table class="rank-table">
        <thead>
          <tr>
            <th class="col-rank">排名</th>
            <th class="col-name">班级名称</th>
            <th class="col-type">班级类型</th>
            <th class="col-teacher">授课教师</th>
            <th class="col-students">学生人数</th>
            <th class="col-capacity">满员率</th>
            <th class="col-income">总收入(元)</th>
            <th class="col-trend">趋势</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(classItem, index) in filteredClassList"
            :key="classItem.id"
          >
            <td class="col-rank">
              <span class="rank-number" :class="getRankClass(index + 1)">
                {{ index + 1 }}
              </span>
            </td>
            <td class="col-name">
              <span class="class-name">{{ classItem.name }}</span>
            </td>
            <td class="col-type">
              <span class="class-type" :class="getTypeClass(classItem.type)">
                {{ classItem.type }}
              </span>
            </td>
            <td class="col-teacher">{{ classItem.teacher }}</td>
            <td class="col-students">{{ classItem.studentCount }}</td>
            <td class="col-capacity">
              <div class="capacity-bar">
                <div
                  class="capacity-fill"
                  :style="{ width: classItem.capacityRate + '%' }"
                  :class="getCapacityClass(classItem.capacityRate)"
                ></div>
              </div>
              <span class="capacity-text">{{ classItem.capacityRate }}%</span>
            </td>
            <td class="col-income">
              <span class="income-value">{{ formatMoney(classItem.totalIncome) }}</span>
            </td>
            <td class="col-trend">
              <span class="trend" :class="getTrendClass(classItem.trend)">
                {{ getTrendIcon(classItem.trend) }} {{ Math.abs(classItem.trend) }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="table-summary">
      <div class="summary-item">
        <span class="label">班级总数</span>
        <span class="value">{{ classList.length }}</span>
      </div>
      <div class="summary-item">
        <span class="label">总学生数</span>
        <span class="value">{{ totalStudents }}</span>
      </div>
      <div class="summary-item">
        <span class="label">总收入</span>
        <span class="value highlight">¥{{ formatMoney(totalIncome) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface ClassRankItem {
  id: number
  name: string
  type: string
  teacher: string
  studentCount: number
  capacityRate: number
  totalIncome: number
  trend: number
}

interface FilterOption {
  label: string
  value: string
}

const filters: FilterOption[] = [
  { label: '全部', value: 'all' },
  { label: '小学', value: '小学' },
  { label: '初中', value: '初中' },
  { label: '高中', value: '高中' }
]

const currentFilter = ref('all')

// Mock 数据
const classList: ClassRankItem[] = [
  {
    id: 1,
    name: '高三数学冲刺班A',
    type: '高中',
    teacher: '张明华',
    studentCount: 25,
    capacityRate: 100,
    totalIncome: 125000,
    trend: 15.2
  },
  {
    id: 2,
    name: '初三英语强化班',
    type: '初中',
    teacher: '李婷婷',
    studentCount: 28,
    capacityRate: 93,
    totalIncome: 98000,
    trend: 8.5
  },
  {
    id: 3,
    name: '高二物理竞赛班',
    type: '高中',
    teacher: '王建国',
    studentCount: 18,
    capacityRate: 90,
    totalIncome: 86400,
    trend: 12.3
  },
  {
    id: 4,
    name: '初二语文阅读班',
    type: '初中',
    teacher: '刘思雨',
    studentCount: 30,
    capacityRate: 100,
    totalIncome: 72000,
    trend: -2.1
  },
  {
    id: 5,
    name: '小学奥数精英班',
    type: '小学',
    teacher: '赵雪梅',
    studentCount: 22,
    capacityRate: 88,
    totalIncome: 66000,
    trend: 20.5
  },
  {
    id: 6,
    name: '高一化学基础班',
    type: '高中',
    teacher: '陈晓峰',
    studentCount: 24,
    capacityRate: 80,
    totalIncome: 57600,
    trend: 5.8
  },
  {
    id: 7,
    name: '初一数学衔接班',
    type: '初中',
    teacher: '郑大伟',
    studentCount: 32,
    capacityRate: 85,
    totalIncome: 51200,
    trend: -5.3
  },
  {
    id: 8,
    name: '小学英语启蒙班',
    type: '小学',
    teacher: '孙美玲',
    studentCount: 20,
    capacityRate: 67,
    totalIncome: 36000,
    trend: 10.2
  },
  {
    id: 9,
    name: '高三英语听力班',
    type: '高中',
    teacher: '吴丽娜',
    studentCount: 26,
    capacityRate: 87,
    totalIncome: 78000,
    trend: 3.6
  },
  {
    id: 10,
    name: '初中物理实验班',
    type: '初中',
    teacher: '周文博',
    studentCount: 18,
    capacityRate: 72,
    totalIncome: 43200,
    trend: -1.2
  }
]

const filteredClassList = computed(() => {
  if (currentFilter.value === 'all') {
    return classList
  }
  return classList.filter(item => item.type === currentFilter.value)
})

const totalStudents = computed(() => {
  return classList.reduce((sum, item) => sum + item.studentCount, 0)
})

const totalIncome = computed(() => {
  return classList.reduce((sum, item) => sum + item.totalIncome, 0)
})

const getRankClass = (rank: number): string => {
  if (rank <= 3) return 'top'
  return 'normal'
}

const getTypeClass = (type: string): string => {
  const classMap: Record<string, string> = {
    '小学': 'primary',
    '初中': 'junior',
    '高中': 'senior'
  }
  return classMap[type] || 'default'
}

const getCapacityClass = (rate: number): string => {
  if (rate >= 90) return 'high'
  if (rate >= 70) return 'medium'
  return 'low'
}

const getTrendClass = (trend: number): string => {
  if (trend > 0) return 'up'
  if (trend < 0) return 'down'
  return 'flat'
}

const getTrendIcon = (trend: number): string => {
  if (trend > 0) return '↑'
  if (trend < 0) return '↓'
  return '→'
}

const formatMoney = (value: number): string => {
  return value.toLocaleString('zh-CN')
}
</script>

<style scoped>
.class-rank-container {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 16px;
  background-color: #fff;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.filter-btn.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.table-wrapper {
  overflow-x: auto;
}

.rank-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.rank-table th {
  background-color: #f5f7fa;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.rank-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #eee;
  color: #555;
}

.rank-table tbody tr:hover {
  background-color: #f5f9ff;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
}

.rank-number.top {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: #fff;
}

.rank-number.normal {
  background-color: #f0f0f0;
  color: #666;
}

.class-name {
  font-weight: 500;
  color: #333;
}

.class-type {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.class-type.primary {
  background-color: #e6f7ff;
  color: #1890ff;
}

.class-type.junior {
  background-color: #f6ffed;
  color: #52c41a;
}

.class-type.senior {
  background-color: #fff7e6;
  color: #fa8c16;
}

.col-capacity {
  min-width: 120px;
}

.capacity-bar {
  width: 80px;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

.capacity-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.capacity-fill.high {
  background: linear-gradient(90deg, #52c41a, #73d13d);
}

.capacity-fill.medium {
  background: linear-gradient(90deg, #faad14, #ffc53d);
}

.capacity-fill.low {
  background: linear-gradient(90deg, #ff4d4f, #ff7875);
}

.capacity-text {
  font-size: 12px;
  color: #888;
}

.income-value {
  font-weight: 600;
  color: #1890ff;
}

.trend {
  font-weight: 500;
  font-size: 13px;
}

.trend.up {
  color: #52c41a;
}

.trend.down {
  color: #ff4d4f;
}

.trend.flat {
  color: #888;
}

.table-summary {
  display: flex;
  justify-content: flex-end;
  gap: 32px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.summary-item .value.highlight {
  color: #1890ff;
}

@media (max-width: 768px) {
  .rank-table {
    font-size: 12px;
  }

  .rank-table th,
  .rank-table td {
    padding: 8px 10px;
  }

  .filter-bar {
    justify-content: center;
  }

  .table-summary {
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  }

  .capacity-bar {
    width: 50px;
  }
}
</style>