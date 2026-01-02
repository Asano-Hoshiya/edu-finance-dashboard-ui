<!-- src/views/FinanceOverview.vue -->
<template>
  <div class="finance-overview">
    <!-- 筛选区 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :xs="24" :sm="12" :md="8">
          <div class="filter-label">时间范围</div>
          <a-range-picker
            v-model:value="filters.range"
            :placeholder="['开始日期', '结束日期']"
            style="width: 100%"
            :allow-clear="false"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :md="8">
          <div class="filter-label">校区（可选）</div>
          <a-select
            v-model:value="filters.campusId"
            allow-clear
            placeholder="全部校区"
            style="width: 100%"
          >
            <a-select-option
              v-for="campus in meta.campuses"
              :key="campus.id"
              :value="campus.id"
            >
              {{ campus.name }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8">
          <div class="filter-label">课型（可选）</div>
          <a-select
            v-model:value="filters.courseType"
            allow-clear
            placeholder="全部课型"
            style="width: 100%"
          >
            <a-select-option
              v-for="ct in meta.courseTypes"
              :key="ct"
              :value="ct"
            >
              {{ ct }}
            </a-select-option>
          </a-select>
        </a-col>
      </a-row>
      <a-row :gutter="12" style="margin-top: 16px">
        <a-col>
          <a-button type="primary" :loading="loading" @click="handleQuery">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
        </a-col>
        <a-col>
          <a-button :loading="loading" @click="handleReset">
            <template #icon><ReloadOutlined /></template>
            重置
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 月度趋势折线图 -->
    <a-card
      title="月度财务趋势"
      :bordered="false"
      class="chart-card"
      :loading="loading"
    >
      <template #extra>
        <span class="chart-tip">缴费金额 / 退费金额 / 净收入</span>
      </template>
      <div ref="lineChartRef" class="chart-container"></div>
    </a-card>

    <!-- 来源构成饼图区域 -->
    <a-row :gutter="16" class="pie-charts-row">
      <!-- 校区收入占比 -->
      <a-col :xs="24" :md="12" :lg="8">
        <a-card
          title="校区收入占比"
          :bordered="false"
          class="chart-card"
          :loading="loading"
        >
          <div ref="campusPieRef" class="pie-chart-container"></div>
        </a-card>
      </a-col>

      <!-- 课型收入占比 -->
      <a-col :xs="24" :md="12" :lg="8">
        <a-card
          title="课型收入占比"
          :bordered="false"
          class="chart-card"
          :loading="loading"
        >
          <div ref="courseTypePieRef" class="pie-chart-container"></div>
        </a-card>
      </a-col>

      <!-- N/R 收入占比 -->
      <a-col :xs="24" :md="12" :lg="8">
        <a-card
          title="N/R 收入占比"
          :bordered="false"
          class="chart-card"
          :loading="loading"
        >
          <div ref="nrIncomePieRef" class="pie-chart-container"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- N/R 生源占比单独一行 -->
    <a-row :gutter="16" class="pie-charts-row">
      <a-col :xs="24" :md="12" :lg="8">
        <a-card
          title="N/R 生源占比"
          :bordered="false"
          class="chart-card"
          :loading="loading"
        >
          <template #extra>
            <span class="chart-tip">按学生人数统计</span>
          </template>
          <div ref="nrStudentPieRef" class="pie-chart-container"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { message } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import dayjs, { Dayjs } from 'dayjs';
import * as echarts from 'echarts';
import { getMeta } from '@/api/meta';
import type { Campus } from '@/api/meta';
import {
  getMonthlyTrend,
  getClassType,
  getCampusIncome,
  getCourseTypeIncome,
} from '@/api/dashboard';
import type {
  DashboardQueryParams,
  MonthlyTrendItem,
  ClassTypeData,
  CampusIncomeItem,
  CourseTypeIncomeItem,
} from '@/api/dashboard';

// ============================================================
// 状态定义
// ============================================================

const loading = ref(false);

// 元数据
const meta = reactive<{
  campuses: Campus[];
  courseTypes: string[];
}>({
  campuses: [],
  courseTypes: [],
});

// 筛选条件
const filters = reactive<{
  range: [Dayjs, Dayjs];
  campusId: string | undefined;
  courseType: string | undefined;
}>({
  range: [dayjs().subtract(11, 'month').startOf('month'), dayjs().endOf('month')],
  campusId: undefined,
  courseType: undefined,
});

// 图表数据
const monthlyData = ref<MonthlyTrendItem[]>([]);
const classTypeData = ref<ClassTypeData | null>(null);
const campusIncomeData = ref<CampusIncomeItem[]>([]);
const courseTypeIncomeData = ref<CourseTypeIncomeItem[]>([]);

// ============================================================
// 图表引用
// ============================================================

const lineChartRef = ref<HTMLDivElement | null>(null);
const campusPieRef = ref<HTMLDivElement | null>(null);
const courseTypePieRef = ref<HTMLDivElement | null>(null);
const nrIncomePieRef = ref<HTMLDivElement | null>(null);
const nrStudentPieRef = ref<HTMLDivElement | null>(null);

let lineChart: echarts.ECharts | null = null;
let campusPieChart: echarts.ECharts | null = null;
let courseTypePieChart: echarts.ECharts | null = null;
let nrIncomePieChart: echarts.ECharts | null = null;
let nrStudentPieChart: echarts.ECharts | null = null;

// ============================================================
// 工具函数
// ============================================================

/**
 * 构建查询参数
 */
function buildQueryParams(): DashboardQueryParams {
  const [start, end] = filters.range;
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
    campusId: filters.campusId,
    courseType: filters.courseType,
  };
}

/**
 * 格式化金额（加千分位）
 */
function formatAmount(value: number): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ============================================================
// 图表渲染
// ============================================================

/**
 * 渲染月度趋势折线图
 */
function renderLineChart(): void {
  if (!lineChart || !lineChartRef.value) return;

  const months = monthlyData.value.map((item) => item.month);
  const payAmounts = monthlyData.value.map((item) => item.payAmount);
  const refundAmounts = monthlyData.value.map((item) => item.refundAmount);
  const netAmounts = monthlyData.value.map((item) => item.netAmount);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const month = params[0]?.axisValue || '';
        let html = `<div style="font-weight:600;margin-bottom:8px;">${month}</div>`;
        params.forEach((item: any) => {
          const color = item.color;
          const name = item.seriesName;
          const value = formatAmount(item.value);
          html += `
            <div style="display:flex;align-items:center;margin:4px 0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>
              <span style="flex:1;">${name}</span>
              <span style="font-weight:600;">¥${value}</span>
            </div>
          `;
        });
        return html;
      },
    },
    legend: {
      data: ['缴费金额', '退费金额', '净收入'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '10%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        rotate: months.length > 6 ? 45 : 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return (value / 10000).toFixed(1) + '万';
          }
          return value.toString();
        },
      },
    },
    series: [
      {
        name: '缴费金额',
        type: 'line',
        smooth: true,
        data: payAmounts,
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
          ]),
        },
      },
      {
        name: '退费金额',
        type: 'line',
        smooth: true,
        data: refundAmounts,
        itemStyle: { color: '#ff4d4f' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 77, 79, 0.3)' },
            { offset: 1, color: 'rgba(255, 77, 79, 0.05)' },
          ]),
        },
      },
      {
        name: '净收入',
        type: 'line',
        smooth: true,
        data: netAmounts,
        itemStyle: { color: '#1890ff' },
        lineStyle: { width: 3 },
      },
    ],
  };

  lineChart.setOption(option, true);
}

/**
 * 渲染饼图通用函数
 */
function renderPieChart(
  chart: echarts.ECharts | null,
  data: { name: string; value: number }[],
  title?: string
): void {
  if (!chart) return;

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const name = params.name;
        const value = formatAmount(params.value);
        const percent = params.percent.toFixed(1);
        return `${name}<br/>¥${value} (${percent}%)`;
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      type: 'scroll',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {d}%',
        },
        labelLine: {
          show: true,
        },
        data: data,
      },
    ],
  };

  chart.setOption(option, true);
}

/**
 * 渲染校区收入饼图
 */
function renderCampusPie(): void {
  const data = campusIncomeData.value.map((item) => ({
    name: item.campusName,
    value: item.payAmount,
  }));
  renderPieChart(campusPieChart, data);
}

/**
 * 渲染课型收入饼图
 */
function renderCourseTypePie(): void {
  const data = courseTypeIncomeData.value.map((item) => ({
    name: item.courseType,
    value: item.payAmount,
  }));
  renderPieChart(courseTypePieChart, data);
}

/**
 * 渲染 N/R 收入占比饼图
 */
function renderNRIncomePie(): void {
  if (!classTypeData.value) return;

  const data = [
    { name: '新开班 (N)', value: classTypeData.value.newPayAmount },
    { name: '续费班 (R)', value: classTypeData.value.renewPayAmount },
  ];
  renderPieChart(nrIncomePieChart, data);
}

/**
 * 渲染 N/R 生源占比饼图
 */
function renderNRStudentPie(): void {
  if (!classTypeData.value || !nrStudentPieChart) return;

  const data = [
    { name: '新开班 (N)', value: classTypeData.value.newStudentCount },
    { name: '续费班 (R)', value: classTypeData.value.renewStudentCount },
  ];

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const name = params.name;
        const value = params.value;
        const percent = params.percent.toFixed(1);
        return `${name}<br/>${value} 人 (${percent}%)`;
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {d}%',
        },
        labelLine: {
          show: true,
        },
        data: data,
      },
    ],
  };

  nrStudentPieChart.setOption(option, true);
}

/**
 * 渲染所有图表
 */
function renderAllCharts(): void {
  renderLineChart();
  renderCampusPie();
  renderCourseTypePie();
  renderNRIncomePie();
  renderNRStudentPie();
}

// ============================================================
// 数据加载
// ============================================================

/**
 * 加载元数据
 */
async function loadMeta(): Promise<void> {
  try {
    const data = await getMeta();
    meta.campuses = data.campuses;
    meta.courseTypes = data.courseTypes;
  } catch (error) {
    console.error('加载元数据失败:', error);
    message.error('加载元数据失败');
  }
}

/**
 * 加载所有图表数据
 */
async function loadChartData(): Promise<void> {
  loading.value = true;

  try {
    const params = buildQueryParams();

    const [monthlyRes, classTypeRes, campusRes, courseTypeRes] = await Promise.all([
      getMonthlyTrend(params),
      getClassType(params),
      getCampusIncome(params),
      getCourseTypeIncome(params),
    ]);

    monthlyData.value = monthlyRes.data.items || [];
    classTypeData.value = classTypeRes.data;
    campusIncomeData.value = campusRes.data.items || [];
    courseTypeIncomeData.value = courseTypeRes.data.items || [];

    renderAllCharts();
  } catch (error) {
    console.error('加载图表数据失败:', error);
    message.error('加载数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

// ============================================================
// 事件处理
// ============================================================

/**
 * 查询按钮点击
 */
function handleQuery(): void {
  loadChartData();
}

/**
 * 重置按钮点击
 */
function handleReset(): void {
  filters.range = [dayjs().subtract(11, 'month').startOf('month'), dayjs().endOf('month')];
  filters.campusId = undefined;
  filters.courseType = undefined;
  loadChartData();
}

/**
 * 窗口大小变化处理
 */
function handleResize(): void {
  lineChart?.resize();
  campusPieChart?.resize();
  courseTypePieChart?.resize();
  nrIncomePieChart?.resize();
  nrStudentPieChart?.resize();
}

// ============================================================
// 生命周期
// ============================================================

onMounted(async () => {
  // 初始化图表实例
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value);
  }
  if (campusPieRef.value) {
    campusPieChart = echarts.init(campusPieRef.value);
  }
  if (courseTypePieRef.value) {
    courseTypePieChart = echarts.init(courseTypePieRef.value);
  }
  if (nrIncomePieRef.value) {
    nrIncomePieChart = echarts.init(nrIncomePieRef.value);
  }
  if (nrStudentPieRef.value) {
    nrStudentPieChart = echarts.init(nrStudentPieRef.value);
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);

  // 加载数据
  await loadMeta();
  await loadChartData();
});

onBeforeUnmount(() => {
  // 移除事件监听
  window.removeEventListener('resize', handleResize);

  // 销毁图表实例
  lineChart?.dispose();
  campusPieChart?.dispose();
  courseTypePieChart?.dispose();
  nrIncomePieChart?.dispose();
  nrStudentPieChart?.dispose();
});
</script>

<style scoped>
.finance-overview {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
}

.filter-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.filter-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.chart-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.chart-tip {
  font-size: 12px;
  color: #999;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.pie-chart-container {
  height: 320px;
  width: 100%;
}

.pie-charts-row {
  margin-bottom: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .finance-overview {
    padding: 12px;
  }

  .chart-container {
    height: 300px;
  }

  .pie-chart-container {
    height: 280px;
  }

  .filter-label {
    margin-top: 12px;
  }
}
</style>