<template>
  <div class="dashboard-container">
    <!-- 筛选区 -->
    <a-card class="filter-card" :bordered="false">
      <a-form layout="inline" :model="filterForm">
        <a-form-item label="时间范围">
          <a-range-picker
            v-model:value="filterForm.dateRange"
            :placeholder="['开始日期', '结束日期']"
            format="YYYY-MM-DD"
            style="width: 240px"
            @change="handleFilterChange"
          />
        </a-form-item>
        <a-form-item label="校区">
          <a-select
            v-model:value="filterForm.campus"
            placeholder="请选择校区"
            style="width: 160px"
            allowClear
            @change="handleFilterChange"
          >
            <a-select-option
              v-for="item in campusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="课型">
          <a-select
            v-model:value="filterForm.courseType"
            placeholder="请选择课型"
            style="width: 160px"
            allowClear
            @change="handleFilterChange"
          >
            <a-select-option
              v-for="item in courseTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            <template #icon><ReloadOutlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- KPI 指标卡区域 -->
    <div class="kpi-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :md="6" v-for="kpi in kpiData" :key="kpi.key">
          <KPICard
            :title="kpi.title"
            :value="kpi.value"
            :prefix="kpi.prefix"
            :suffix="kpi.suffix"
            :trend="kpi.trend"
            :trendValue="kpi.trendValue"
            :icon="kpi.icon"
            :color="kpi.color"
          />
        </a-col>
      </a-row>
    </div>

    <!-- 风险指标区域 -->
    <div class="risk-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :md="8" v-for="risk in riskData" :key="risk.key">
          <RiskCard
            :title="risk.title"
            :value="risk.value"
            :level="risk.level"
            :description="risk.description"
            :threshold="risk.threshold"
          />
        </a-col>
      </a-row>
    </div>

    <!-- 图表区域 -->
    <a-row :gutter="[16, 16]" class="chart-section">
      <a-col :xs="24" :lg="16">
        <a-card title="收入趋势" :bordered="false" class="chart-card">
          <LineChart
            :chartData="lineChartData"
            :loading="chartLoading"
            height="350px"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="8">
        <a-card title="收入构成" :bordered="false" class="chart-card">
          <PieChart
            :chartData="pieChartData"
            :loading="chartLoading"
            height="350px"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 排行榜区域 -->
    <a-row :gutter="[16, 16]" class="rank-section">
      <a-col :xs="24" :lg="12">
        <a-card title="班主任业绩排行 TOP10" :bordered="false" class="rank-card">
          <TeacherRankTable :dataSource="teacherRankData" :loading="tableLoading" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="班级收入排行 TOP10" :bordered="false" class="rank-card">
          <ClassRankTable :dataSource="classRankData" :loading="tableLoading" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

// 组件导入
import KPICard from '@/components/KPICard.vue'
import RiskCard from '@/components/RiskCard.vue'
import LineChart from '@/components/LineChart.vue'
import PieChart from '@/components/PieChart.vue'
import TeacherRankTable from '@/components/TeacherRankTable.vue'
import ClassRankTable from '@/components/ClassRankTable.vue'

// 类型定义
interface FilterForm {
  dateRange: [Dayjs, Dayjs] | null
  campus: string | undefined
  courseType: string | undefined
}

interface KPIItem {
  key: string
  title: string
  value: number
  prefix?: string
  suffix?: string
  trend: 'up' | 'down' | 'flat'
  trendValue: string
  icon: string
  color: string
}

interface RiskItem {
  key: string
  title: string
  value: number
  level: 'high' | 'medium' | 'low'
  description: string
  threshold: number
}

interface SelectOption {
  label: string
  value: string
}

// 筛选表单
const filterForm = reactive<FilterForm>({
  dateRange: [dayjs().subtract(30, 'day'), dayjs()],
  campus: undefined,
  courseType: undefined
})

// 加载状态
const chartLoading = ref(false)
const tableLoading = ref(false)

// 下拉选项 Mock 数据
const campusOptions = ref<SelectOption[]>([
  { label: '全部校区', value: '' },
  { label: '北京总部', value: 'beijing' },
  { label: '上海分校', value: 'shanghai' },
  { label: '广州分校', value: 'guangzhou' },
  { label: '深圳分校', value: 'shenzhen' },
  { label: '杭州分校', value: 'hangzhou' }
])

const courseTypeOptions = ref<SelectOption[]>([
  { label: '全部课型', value: '' },
  { label: '一对一', value: 'one2one' },
  { label: '小班课', value: 'small' },
  { label: '大班课', value: 'large' },
  { label: '线上课', value: 'online' },
  { label: '寒暑假班', value: 'vacation' }
])

// KPI Mock 数据
const kpiData = ref<KPIItem[]>([
  {
    key: 'totalRevenue',
    title: '总收入',
    value: 5862340,
    prefix: '¥',
    trend: 'up',
    trendValue: '+12.5%',
    icon: 'money-collect',
    color: '#1890ff'
  },
  {
    key: 'newEnrollment',
    title: '新签金额',
    value: 2345680,
    prefix: '¥',
    trend: 'up',
    trendValue: '+8.3%',
    icon: 'user-add',
    color: '#52c41a'
  },
  {
    key: 'renewalAmount',
    title: '续费金额',
    value: 1876540,
    prefix: '¥',
    trend: 'down',
    trendValue: '-3.2%',
    icon: 'sync',
    color: '#faad14'
  },
  {
    key: 'refundAmount',
    title: '退费金额',
    value: 359880,
    prefix: '¥',
    trend: 'down',
    trendValue: '-5.8%',
    icon: 'rollback',
    color: '#ff4d4f'
  },
  {
    key: 'studentCount',
    title: '在读学员',
    value: 3256,
    suffix: '人',
    trend: 'up',
    trendValue: '+156',
    icon: 'team',
    color: '#722ed1'
  },
  {
    key: 'classCount',
    title: '开班数量',
    value: 186,
    suffix: '个',
    trend: 'up',
    trendValue: '+12',
    icon: 'book',
    color: '#13c2c2'
  },
  {
    key: 'avgClassPrice',
    title: '班均收入',
    value: 31517,
    prefix: '¥',
    trend: 'up',
    trendValue: '+6.7%',
    icon: 'bar-chart',
    color: '#eb2f96'
  },
  {
    key: 'renewalRate',
    title: '续费率',
    value: 72.5,
    suffix: '%',
    trend: 'flat',
    trendValue: '+0.3%',
    icon: 'percentage',
    color: '#fa8c16'
  }
])

// 风险指标 Mock 数据
const riskData = ref<RiskItem[]>([
  {
    key: 'refundRate',
    title: '退费率',
    value: 6.14,
    level: 'medium',
    description: '较上月上升0.5%，需关注退费原因',
    threshold: 5
  },
  {
    key: 'overdueFee',
    title: '逾期未收款',
    value: 128650,
    level: 'high',
    description: '超过30天未回款金额，涉及23个订单',
    threshold: 100000
  },
  {
    key: 'consumptionRate',
    title: '课消完成率',
    value: 85.3,
    level: 'low',
    description: '本月课消进度良好，预计可完成目标',
    threshold: 80
  }
])

// 折线图 Mock 数据
const lineChartData = ref({
  xAxis: [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ],
  series: [
    {
      name: '总收入',
      data: [420, 380, 450, 520, 580, 620, 680, 750, 620, 580, 540, 586],
      color: '#1890ff'
    },
    {
      name: '新签',
      data: [180, 160, 200, 240, 280, 300, 320, 380, 280, 240, 220, 234],
      color: '#52c41a'
    },
    {
      name: '续费',
      data: [150, 140, 160, 180, 200, 220, 240, 260, 220, 200, 190, 187],
      color: '#faad14'
    },
    {
      name: '退费',
      data: [30, 28, 35, 40, 45, 50, 55, 60, 48, 42, 38, 36],
      color: '#ff4d4f'
    }
  ],
  unit: '万元'
})

// 饼图 Mock 数据
const pieChartData = ref({
  series: [
    { name: '一对一', value: 1856340, color: '#1890ff' },
    { name: '小班课', value: 1523680, color: '#52c41a' },
    { name: '大班课', value: 986450, color: '#faad14' },
    { name: '线上课', value: 756230, color: '#722ed1' },
    { name: '寒暑假班', value: 739640, color: '#13c2c2' }
  ]
})

// 班主任排行 Mock 数据
const teacherRankData = ref([
  { rank: 1, name: '张老师', campus: '北京总部', revenue: 456780, studentCount: 45, renewalRate: 85.5 },
  { rank: 2, name: '李老师', campus: '上海分校', revenue: 423560, studentCount: 42, renewalRate: 82.3 },
  { rank: 3, name: '王老师', campus: '北京总部', revenue: 398450, studentCount: 38, renewalRate: 79.8 },
  { rank: 4, name: '陈老师', campus: '广州分校', revenue: 365230, studentCount: 35, renewalRate: 76.5 },
  { rank: 5, name: '刘老师', campus: '深圳分校', revenue: 342180, studentCount: 33, renewalRate: 74.2 },
  { rank: 6, name: '赵老师', campus: '杭州分校', revenue: 318760, studentCount: 31, renewalRate: 71.8 },
  { rank: 7, name: '周老师', campus: '北京总部', revenue: 295430, studentCount: 29, renewalRate: 69.5 },
  { rank: 8, name: '吴老师', campus: '上海分校', revenue: 278650, studentCount: 27, renewalRate: 67.3 },
  { rank: 9, name: '郑老师', campus: '广州分校', revenue: 256890, studentCount: 25, renewalRate: 65.1 },
  { rank: 10, name: '孙老师', campus: '深圳分校', revenue: 234560, studentCount: 23, renewalRate: 62.8 }
])

// 班级排行 Mock 数据
const classRankData = ref([
  { rank: 1, className: '高三冲刺A班', teacher: '张老师', revenue: 186540, studentCount: 25, avgPrice: 7462 },
  { rank: 2, className: '初三提高B班', teacher: '李老师', revenue: 165230, studentCount: 22, avgPrice: 7511 },
  { rank: 3, className: '高一培优班', teacher: '王老师', revenue: 152680, studentCount: 20, avgPrice: 7634 },
  { rank: 4, className: '初二基础班', teacher: '陈老师', revenue: 138450, studentCount: 23, avgPrice: 6020 },
  { rank: 5, className: '高二实验班', teacher: '刘老师', revenue: 125630, studentCount: 18, avgPrice: 6980 },
  { rank: 6, className: '小升初衔接班', teacher: '赵老师', revenue: 118760, studentCount: 24, avgPrice: 4948 },
  { rank: 7, className: '高三艺考班', teacher: '周老师', revenue: 105430, studentCount: 15, avgPrice: 7029 },
  { rank: 8, className: '初一预备班', teacher: '吴老师', revenue: 98650, studentCount: 26, avgPrice: 3794 },
  { rank: 9, className: '中考冲刺班', teacher: '郑老师', revenue: 92340, studentCount: 20, avgPrice: 4617 },
  { rank: 10, className: '高考复读班', teacher: '孙老师', revenue: 86780, studentCount: 12, avgPrice: 7232 }
])

// 方法定义
const handleFilterChange = () => {
  console.log('Filter changed:', filterForm)
}

const handleSearch = () => {
  chartLoading.value = true
  tableLoading.value = true

  // 模拟异步加载
  setTimeout(() => {
    chartLoading.value = false
    tableLoading.value = false
    console.log('Search with filters:', {
      dateRange: filterForm.dateRange?.map(d => d.format('YYYY-MM-DD')),
      campus: filterForm.campus,
      courseType: filterForm.courseType
    })
  }, 500)
}

const handleReset = () => {
  filterForm.dateRange = [dayjs().subtract(30, 'day'), dayjs()]
  filterForm.campus = undefined
  filterForm.courseType = undefined
  handleSearch()
}

// 初始化加载
onMounted(() => {
  handleSearch()
})
</script>

<style lang="less" scoped>
.dashboard-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  :deep(.ant-card-body) {
    padding: 16px 24px;
  }

  :deep(.ant-form-item) {
    margin-bottom: 0;
  }
}

.kpi-section {
  margin-bottom: 24px;
}

.risk-section {
  margin-bottom: 24px;
}

.chart-section {
  margin-bottom: 24px;

  .chart-card {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    height: 100%;

    :deep(.ant-card-head) {
      border-bottom: 1px solid #f0f0f0;
    }

    :deep(.ant-card-body) {
      padding: 16px;
    }
  }
}

.rank-section {
  .rank-card {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

    :deep(.ant-card-head) {
      border-bottom: 1px solid #f0f0f0;
    }

    :deep(.ant-card-body) {
      padding: 0;
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;
  }

  .filter-card {
    :deep(.ant-form-inline .ant-form-item) {
      margin-bottom: 12px;
      width: 100%;

      .ant-form-item-control {
        flex: 1;
      }
    }

    :deep(.ant-picker),
    :deep(.ant-select) {
      width: 100% !important;
    }
  }
}

@media (max-width: 576px) {
  .dashboard-container {
    padding: 8px;
  }

  .filter-card,
  .chart-section .chart-card,
  .rank-section .rank-card {
    border-radius: 4px;
  }
}
</style>