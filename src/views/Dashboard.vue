<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard-container">
    <!-- 筛选区 -->
    <a-card class="filter-card" :bordered="false">
      <a-row :gutter="16" align="middle">
        <a-col :xs="24" :sm="24" :md="8" :lg="8">
          <div class="filter-label">时间范围</div>
          <a-range-picker
            v-model:value="filters.range"
            :placeholder="['开始日期', '结束日期']"
            style="width: 100%"
            :allow-clear="false"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <div class="filter-label">校区（可选）</div>
          <a-select
            v-model:value="filters.campusId"
            allow-clear
            placeholder="全部校区"
            style="width: 100%"
            :loading="metaLoading"
          >
            <a-select-option
              v-for="campus in metaData.campuses"
              :key="campus.id"
              :value="campus.id"
            >
              {{ campus.name }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <div class="filter-label">课型（可选）</div>
          <a-select
            v-model:value="filters.courseType"
            allow-clear
            placeholder="全部课型"
            style="width: 100%"
          >
            <a-select-option
              v-for="courseType in metaData.courseTypes"
              :key="courseType"
              :value="courseType"
            >
              {{ courseType }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="24" :md="4" :lg="4">
          <div class="filter-label">&nbsp;</div>
          <a-space>
            <a-button type="primary" :loading="loading" @click="handleQuery">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button :loading="loading" @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </a-card>

    <!-- KPI 卡片区 - 第一行 -->
    <a-row :gutter="16" class="kpi-row">
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <KpiCard
          title="缴费人数"
          :value="summary.payCount"
          suffix="人"
          icon="team"
          color="#1890ff"
          :loading="loading"
        />
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <KpiCard
          title="实缴金额"
          :value="summary.payAmount"
          prefix="¥"
          :precision="2"
          icon="pay-circle"
          color="#52c41a"
          :loading="loading"
        />
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <KpiCard
          title="退费金额"
          :value="summary.refundAmount"
          prefix="¥"
          :precision="2"
          icon="transaction"
          color="#faad14"
          :loading="loading"
        />
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <KpiCard
          title="净收入"
          :value="summary.netAmount"
          prefix="¥"
          :precision="2"
          icon="fund"
          color="#722ed1"
          :loading="loading"
        />
      </a-col>
    </a-row>

    <!-- 风险指标区 - 第二行 -->
    <a-row :gutter="16" class="risk-row">
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <RiskCard
          title="人数退费率"
          :value="summary.refundRateByCount"
          type="warning"
          description="= 退费人数 ÷ 缴费人数"
          :loading="loading"
        />
      </a-col>
      <a-col :xs="24" :sm="12" :md="6" :lg="6">
        <RiskCard
          title="金额退费率"
          :value="summary.refundRateByAmount"
          type="danger"
          description="= 退费金额 ÷ 缴费金额"
          :loading="loading"
        />
      </a-col>
      <a-col :xs="24" :sm="24" :md="12" :lg="12">
        <a-card class="explanation-card" :bordered="false">
          <div class="explanation-title">
            <InfoCircleOutlined /> 口径说明
          </div>
          <div class="explanation-content">
            <p><strong>人数退费率</strong>：用于教务/班主任管理，反映学员流失情况</p>
            <p><strong>金额退费率</strong>：用于财务/现金流风险评估，反映资金回收风险</p>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表区 -->
    <a-row :gutter="16" class="chart-row">
      <a-col :xs="24" :sm="24" :md="8" :lg="8">
        <a-card title="班级类型占比（N/R）" :bordered="false" :loading="loading">
          <template #extra>
            <a-tooltip title="N=新开班，R=续费班">
              <QuestionCircleOutlined />
            </a-tooltip>
          </template>
          <PieChart
            :data="classTypePieData"
            :config="pieChartConfig"
            height="320px"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="24" :md="16" :lg="16">
        <a-card title="月度净收入趋势" :bordered="false" :loading="loading">
          <template #extra>
            <a-tooltip title="按月统计净收入变化趋势">
              <QuestionCircleOutlined />
            </a-tooltip>
          </template>
          <LineChart
            :data="monthlyLineData"
            :config="lineChartConfig"
            height="320px"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 表格排行区 -->
    <a-row :gutter="16" class="table-row">
      <a-col :xs="24" :sm="24" :md="12" :lg="12">
        <a-card title="班主任绩效（Top）" :bordered="false" :loading="loading">
          <template #extra>
            <a-tooltip title="按实缴金额排序">
              <TrophyOutlined style="color: #faad14" />
            </a-tooltip>
          </template>
          <TeacherRankTable
            :data="teacherRankData"
            :loading="loading"
            :page-size="8"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="24" :md="12" :lg="12">
        <a-card title="班级经营（Top）" :bordered="false" :loading="loading">
          <template #extra>
            <a-tooltip title="按净收入排序">
              <BarChartOutlined style="color: #1890ff" />
            </a-tooltip>
          </template>
          <ClassRankTable
            :data="classRankData"
            :loading="loading"
            :page-size="8"
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
  BarChartOutlined
} from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'

// API
import { getMeta, type MetaData } from '@/api/meta'
import {
  getSummary,
  getClassType,
  getMonthlyTrend,
  getTeacherRank,
  getClassRank,
  type SummaryData,
  type ClassTypeData,
  type MonthlyTrendItem,
  type TeacherRankItem,
  type ClassRankItem,
  type DashboardQueryParams
} from '@/api/dashboard'

// 组件
import KpiCard from '@/components/KpiCard.vue'
import RiskCard from '@/components/RiskCard.vue'
import PieChart from '@/components/PieChart.vue'
import LineChart from '@/components/LineChart.vue'
import TeacherRankTable from '@/components/TeacherRankTable.vue'
import ClassRankTable from '@/components/ClassRankTable.vue'

// 类型
import type { PieChartData, PieChartConfig, LineChartData, LineChartConfig } from '@/types'

// ============================================================
// 状态定义
// ============================================================

// 加载状态
const loading = ref(false)
const metaLoading = ref(false)

// 筛选条件
const filters = reactive<{
  range: [Dayjs, Dayjs]
  campusId: string | undefined
  courseType: string | undefined
}>({
  range: [dayjs().startOf('month'), dayjs().endOf('month')],
  campusId: undefined,
  courseType: undefined
})

// 元数据
const metaData = reactive<MetaData>({
  campuses: [],
  courseTypes: []
})

// KPI 数据
const summary = reactive<SummaryData>({
  payCount: 0,
  payAmount: 0,
  refundCount: 0,
  refundAmount: 0,
  netAmount: 0,
  refundRateByCount: 0,
  refundRateByAmount: 0
})

// 班级类型数据
const classTypeData = reactive<ClassTypeData>({
  newCount: 0,
  renewCount: 0,
  newPayAmount: 0,
  renewPayAmount: 0,
  newStudentCount: 0,
  renewStudentCount: 0
})


// 月度趋势数据
const monthlyTrendData = ref<MonthlyTrendItem[]>([])

// 班主任排行数据
const teacherRankData = ref<TeacherRankItem[]>([])

// 班级排行数据
const classRankData = ref<ClassRankItem[]>([])

// ============================================================
// 计算属性 - 图表数据转换
// ============================================================

// 饼图数据
const classTypePieData = computed<PieChartData>(() => ({
  items: [
    { name: '新开班 (N)', value: classTypeData.newCount },
    { name: '续费班 (R)', value: classTypeData.renewCount }
  ]
}))

// 饼图配置
const pieChartConfig: PieChartConfig = {
  showLegend: true,
  legendPosition: 'bottom',
  showTooltip: true,
  showLabel: true,
  labelPosition: 'outside',
  labelFormat: 'namePercent',
  radius: ['40%', '70%'],
  colors: ['#1890ff', '#52c41a'],
  animation: true,
  borderRadius: 4
}

// 折线图数据
const monthlyLineData = computed<LineChartData>(() => ({
  xAxis: monthlyTrendData.value.map((item) => item.month),
  series: [
    {
      name: '净收入',
      data: monthlyTrendData.value.map((item) => item.netAmount),
      type: 'line',
      smooth: true,
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: '#722ed1'
      }
    }
  ]
}))

// 折线图配置
const lineChartConfig: LineChartConfig = {
  showLegend: true,
  legendPosition: 'top',
  showTooltip: true,
  showGrid: true,
  gridConfig: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  yAxisConfig: {
    name: '金额（元）'
  },
  colors: ['#722ed1'],
  animation: true
}

// ============================================================
// 方法
// ============================================================

/**
 * 构建查询参数
 */
function buildQueryParams(): DashboardQueryParams {
  const [start, end] = filters.range
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
    campusId: filters.campusId,
    courseType: filters.courseType
  }
}

/**
 * 加载元数据
 */
async function loadMeta(): Promise<void> {
  metaLoading.value = true
  try {
    const data = await getMeta()
    metaData.campuses = data.campuses
    metaData.courseTypes = data.courseTypes
  } catch (error) {
    console.error('加载元数据失败:', error)
    message.error('加载筛选选项失败，请刷新重试')
  } finally {
    metaLoading.value = false
  }
}

/**
 * 加载所有 Dashboard 数据
 */
async function loadDashboardData(): Promise<void> {
  loading.value = true
  const params = buildQueryParams()

  try {
    // 并发请求所有数据
    const [summaryRes, classTypeRes, monthlyRes, teacherRes, classRes] =
      await Promise.all([
        getSummary(params),
        getClassType(params),
        getMonthlyTrend(params),
        getTeacherRank(params),
        getClassRank(params)
      ])

    // 更新 KPI 数据
    if (summaryRes.code === 0) {
      Object.assign(summary, summaryRes.data)
    }

    // 更新班级类型数据
    if (classTypeRes.code === 0) {
      Object.assign(classTypeData, classTypeRes.data)
    }

    // 更新月度趋势数据
    if (monthlyRes.code === 0) {
      monthlyTrendData.value = monthlyRes.data.items || []
    }

    // 更新班主任排行数据
    if (teacherRes.code === 0) {
      teacherRankData.value = teacherRes.data.items || []
    }

    // 更新班级排行数据
    if (classRes.code === 0) {
      classRankData.value = classRes.data.items || []
    }
  } catch (error) {
    console.error('加载 Dashboard 数据失败:', error)
    message.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

/**
 * 查询按钮点击
 */
function handleQuery(): void {
  loadDashboardData()
}

/**
 * 重置按钮点击
 */
function handleReset(): void {
  filters.range = [dayjs().startOf('month'), dayjs().endOf('month')]
  filters.campusId = undefined
  filters.courseType = undefined
  loadDashboardData()
}

// ============================================================
// 生命周期
// ============================================================

onMounted(async () => {
  // 并发加载元数据和 Dashboard 数据
  await Promise.all([loadMeta(), loadDashboardData()])
})
</script>

<style scoped>
.dashboard-container {
  padding: 16px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.filter-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.filter-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.85);
}

.kpi-row {
  margin-bottom: 16px;
}

.kpi-row .ant-col {
  margin-bottom: 16px;
}

.risk-row {
  margin-bottom: 16px;
}

.risk-row .ant-col {
  margin-bottom: 16px;
}

.explanation-card {
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
}

.explanation-title {
  font-weight: 600;
  font-size: 14px;
  color: #1890ff;
  margin-bottom: 12px;
}

.explanation-content {
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.8;
}

.explanation-content p {
  margin-bottom: 4px;
}

.chart-row {
  margin-bottom: 16px;
}

.chart-row .ant-col {
  margin-bottom: 16px;
}

.chart-row .ant-card {
  border-radius: 8px;
  height: 100%;
}

.table-row .ant-col {
  margin-bottom: 16px;
}

.table-row .ant-card {
  border-radius: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;
  }

  .filter-label {
    margin-top: 12px;
  }
}
</style>