<template>
  <div class="class-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">班级经营看板</h1>
      <p class="page-subtitle">查看各班级的缴费、退费及人数统计</p>
    </div>

    <!-- 筛选区域 -->
    <a-card class="filter-card" :bordered="false">
      <a-row :gutter="16" align="middle">
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="filter-label">时间范围</div>
          <a-range-picker
            v-model:value="filters.dateRange"
            :placeholder="['开始日期', '结束日期']"
            style="width: 100%"
            :allow-clear="false"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="filter-label">校区</div>
          <a-select
            v-model:value="filters.campusId"
            placeholder="全部校区"
            allow-clear
            style="width: 100%"
          >
            <a-select-option v-for="campus in meta.campuses" :key="campus.id" :value="campus.id">
              {{ campus.name }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="filter-label">课型</div>
          <a-select
            v-model:value="filters.courseType"
            placeholder="全部课型"
            allow-clear
            style="width: 100%"
          >
            <a-select-option v-for="type in meta.courseTypes" :key="type" :value="type">
              {{ type }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="filter-label">&nbsp;</div>
          <a-space>
            <a-button type="primary" :loading="loading" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </a-card>

    <!-- 汇总 KPI 卡片 -->
    <a-row :gutter="16" class="kpi-row">
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="kpi-card" :bordered="false" :loading="loading">
          <a-statistic
            title="班级数量"
            :value="summaryStats.classCount"
            :value-style="{ color: 'var(--primary-color)' }"
          >
            <template #suffix>个</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="kpi-card" :bordered="false" :loading="loading">
          <a-statistic
            title="总缴费人数"
            :value="summaryStats.totalPayCount"
            :value-style="{ color: 'var(--success-color)' }"
          >
            <template #suffix>人</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="kpi-card" :bordered="false" :loading="loading">
          <a-statistic
            title="总退费人数"
            :value="summaryStats.totalRefundCount"
            :value-style="{ color: 'var(--warning-color)' }"
          >
            <template #suffix>人</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="kpi-card" :bordered="false" :loading="loading">
          <a-statistic
            title="总缴费额"
            :value="summaryStats.totalPayAmount"
            :precision="2"
            :value-style="{ color: 'var(--success-color)' }"
          >
            <template #prefix>¥</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="kpi-card" :bordered="false" :loading="loading">
          <a-statistic
            title="总退费额"
            :value="summaryStats.totalRefundAmount"
            :precision="2"
            :value-style="{ color: 'var(--warning-color)' }"
          >
            <template #prefix>¥</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="kpi-card" :bordered="false" :loading="loading">
          <a-statistic
            title="总净收入"
            :value="summaryStats.totalNetAmount"
            :precision="2"
            :value-style="{ color: summaryStats.totalNetAmount >= 0 ? 'var(--primary-color)' : 'var(--danger-color)' }"
          >
            <template #prefix>¥</template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 班级对比条形图 -->
    <a-card class="chart-card" :bordered="false" :loading="loading">
      <template #title>
        <div class="card-title-wrapper">
          <span class="card-title">班级对比</span>
          <a-radio-group v-model:value="chartMetric" size="small" button-style="solid">
            <a-radio-button value="amount">金额</a-radio-button>
            <a-radio-button value="count">人数</a-radio-button>
          </a-radio-group>
        </div>
      </template>
      <div ref="barChartRef" class="bar-chart-container"></div>
    </a-card>

    <!-- 班级明细表格 -->
    <a-card class="table-card" :bordered="false">
      <template #title>
        <span class="card-title">班级经营明细</span>
      </template>
      <template #extra>
        <a-button type="link" @click="handleExport">
          <template #icon><DownloadOutlined /></template>
          导出
        </a-button>
      </template>
      <a-table
        :columns="tableColumns"
        :data-source="classData"
        :loading="loading"
        :pagination="tablePagination"
        :scroll="{ x: 1000 }"
        row-key="classId"
        size="middle"
        @change="handleTableChange"
      >
        <!-- 班级名称 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'classDisplay'">
            <span class="class-name">{{ record.classDisplay }}</span>
          </template>

          <!-- 缴费金额 -->
          <template v-else-if="column.dataIndex === 'payAmount'">
            <span class="amount-positive">¥{{ formatNumber(record.payAmount) }}</span>
          </template>

          <!-- 退费金额 -->
          <template v-else-if="column.dataIndex === 'refundAmount'">
            <span class="amount-negative">¥{{ formatNumber(record.refundAmount) }}</span>
          </template>

          <!-- 净收入 -->
          <template v-else-if="column.dataIndex === 'netAmount'">
            <span :class="record.netAmount >= 0 ? 'amount-positive' : 'amount-negative'">
              ¥{{ formatNumber(record.netAmount) }}
            </span>
          </template>

          <!-- 缴费人数 -->
          <template v-else-if="column.dataIndex === 'payCount'">
            <a-tag color="green">{{ record.payCount }}人</a-tag>
          </template>

          <!-- 退费人数 -->
          <template v-else-if="column.dataIndex === 'refundCount'">
            <a-tag :color="record.refundCount > 0 ? 'orange' : 'default'">
              {{ record.refundCount }}人
            </a-tag>
          </template>

          <!-- 留存人数 -->
          <template v-else-if="column.dataIndex === 'retentionCount'">
            <span>{{ record.payCount - record.refundCount }}人</span>
          </template>

          <!-- 留存率 -->
          <template v-else-if="column.dataIndex === 'retentionRate'">
            <a-progress
              :percent="calcRetentionRate(record)"
              :size="'small'"
              :stroke-color="getRetentionColor(calcRetentionRate(record))"
              :format="(percent: number) => `${percent.toFixed(1)}%`"
              style="width: 100px"
            />
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { message } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons-vue';
import dayjs, { Dayjs } from 'dayjs';
import * as echarts from 'echarts';
import { getClassRank, type ClassRankItem, type DashboardQueryParams } from '@/api/dashboard';
import { getMeta, type Campus } from '@/api/meta';

// ============================================================
// 类型定义
// ============================================================

interface FilterState {
  dateRange: [Dayjs, Dayjs];
  campusId: string | undefined;
  courseType: string | undefined;
}

interface MetaState {
  campuses: Campus[];
  courseTypes: string[];
}

interface SummaryStats {
  classCount: number;
  totalPayCount: number;
  totalRefundCount: number;
  totalPayAmount: number;
  totalRefundAmount: number;
  totalNetAmount: number;
}

// ============================================================
// 响应式状态
// ============================================================

const loading = ref(false);
const chartMetric = ref<'amount' | 'count'>('amount');

// 筛选条件
const filters = reactive<FilterState>({
  dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
  campusId: undefined,
  courseType: undefined,
});

// 元数据
const meta = reactive<MetaState>({
  campuses: [],
  courseTypes: [],
});

// 班级数据
const classData = ref<ClassRankItem[]>([]);

// 汇总统计
const summaryStats = computed<SummaryStats>(() => {
  const data = classData.value;
  return {
    classCount: data.length,
    totalPayCount: data.reduce((sum, item) => sum + item.payCount, 0),
    totalRefundCount: data.reduce((sum, item) => sum + item.refundCount, 0),
    totalPayAmount: data.reduce((sum, item) => sum + item.payAmount, 0),
    totalRefundAmount: data.reduce((sum, item) => sum + item.refundAmount, 0),
    totalNetAmount: data.reduce((sum, item) => sum + item.netAmount, 0),
  };
});

// 表格分页
const tablePagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 个班级`,
  pageSizeOptions: ['10', '20', '50', '100'],
});

// 表格列定义
const tableColumns = [
  {
    title: '班级',
    dataIndex: 'classDisplay',
    key: 'classDisplay',
    width: 200,
    fixed: 'left' as const,
  },
  {
    title: '班主任',
    dataIndex: 'teacherName',
    key: 'teacherName',
    width: 100,
  },
  {
    title: '缴费人数',
    dataIndex: 'payCount',
    key: 'payCount',
    width: 100,
    sorter: (a: ClassRankItem, b: ClassRankItem) => a.payCount - b.payCount,
  },
  {
    title: '退费人数',
    dataIndex: 'refundCount',
    key: 'refundCount',
    width: 100,
    sorter: (a: ClassRankItem, b: ClassRankItem) => a.refundCount - b.refundCount,
  },
  {
    title: '留存人数',
    dataIndex: 'retentionCount',
    key: 'retentionCount',
    width: 100,
  },
  {
    title: '留存率',
    dataIndex: 'retentionRate',
    key: 'retentionRate',
    width: 140,
    sorter: (a: ClassRankItem, b: ClassRankItem) => calcRetentionRate(a) - calcRetentionRate(b),
  },
  {
    title: '缴费金额',
    dataIndex: 'payAmount',
    key: 'payAmount',
    width: 120,
    sorter: (a: ClassRankItem, b: ClassRankItem) => a.payAmount - b.payAmount,
  },
  {
    title: '退费金额',
    dataIndex: 'refundAmount',
    key: 'refundAmount',
    width: 120,
    sorter: (a: ClassRankItem, b: ClassRankItem) => a.refundAmount - b.refundAmount,
  },
  {
    title: '净收入',
    dataIndex: 'netAmount',
    key: 'netAmount',
    width: 120,
    sorter: (a: ClassRankItem, b: ClassRankItem) => a.netAmount - b.netAmount,
    defaultSortOrder: 'descend' as const,
  },
];

// ============================================================
// 图表相关
// ============================================================

const barChartRef = ref<HTMLDivElement | null>(null);
let barChart: echarts.ECharts | null = null;

function initChart() {
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value);
  }
}

function renderChart() {
  if (!barChart) return;

  // 取 Top 15 班级用于展示
  const topData = [...classData.value]
    .sort((a, b) => b.netAmount - a.netAmount)
    .slice(0, 15);

  const classNames = topData.map((item) => item.classDisplay);

  let series: echarts.BarSeriesOption[];

  if (chartMetric.value === 'amount') {
    series = [
      {
        name: '缴费金额',
        type: 'bar',
        data: topData.map((item) => item.payAmount),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '退费金额',
        type: 'bar',
        data: topData.map((item) => item.refundAmount),
        itemStyle: { color: '#faad14' },
      },
      {
        name: '净收入',
        type: 'bar',
        data: topData.map((item) => item.netAmount),
        itemStyle: {
          color: (params) => {
            const value = params.value as number;
            return value >= 0 ? '#1890ff' : '#ff4d4f';
          },
        },
      },
    ];
  } else {
    series = [
      {
        name: '缴费人数',
        type: 'bar',
        data: topData.map((item) => item.payCount),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '退费人数',
        type: 'bar',
        data: topData.map((item) => item.refundCount),
        itemStyle: { color: '#faad14' },
      },
      {
        name: '留存人数',
        type: 'bar',
        data: topData.map((item) => item.payCount - item.refundCount),
        itemStyle: { color: '#1890ff' },
      },
    ];
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        if (!Array.isArray(params)) return '';
        const title = params[0]?.axisValueLabel || '';
        let content = `<div style="font-weight:600;margin-bottom:8px;">${title}</div>`;
        params.forEach((p) => {
          const value = p.value as number;
          const formattedValue = chartMetric.value === 'amount'
            ? `¥${formatNumber(value)}`
            : `${value}人`;
          content += `<div style="display:flex;justify-content:space-between;gap:16px;">
            <span>${p.marker}${p.seriesName}</span>
            <span style="font-weight:600;">${formattedValue}</span>
          </div>`;
        });
        return content;
      },
    },
    legend: {
      top: 0,
      left: 'center',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: classNames,
      axisLabel: {
        rotate: 30,
        interval: 0,
        width: 80,
        overflow: 'truncate',
        ellipsis: '...',
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (chartMetric.value === 'amount') {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + '万';
            }
            return value.toString();
          }
          return value.toString();
        },
      },
    },
    series,
  };

  barChart.setOption(option, true);
}

function handleResize() {
  barChart?.resize();
}

// ============================================================
// 数据加载
// ============================================================

function buildQueryParams(): DashboardQueryParams {
  const [start, end] = filters.dateRange;
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
    campusId: filters.campusId,
    courseType: filters.courseType,
  };
}

async function fetchMeta() {
  try {
    const data = await getMeta();
    meta.campuses = data.campuses;
    meta.courseTypes = data.courseTypes;
  } catch (error) {
    console.error('获取元数据失败:', error);
    message.error('获取筛选选项失败');
  }
}

async function fetchClassData() {
  loading.value = true;
  try {
    const params = buildQueryParams();
    const response = await getClassRank(params);
    classData.value = response.data.items || [];
    tablePagination.total = classData.value.length;
    renderChart();
  } catch (error) {
    console.error('获取班级数据失败:', error);
    message.error('获取班级数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

async function loadData() {
  await Promise.all([fetchMeta(), fetchClassData()]);
}

// ============================================================
// 事件处理
// ============================================================

function handleSearch() {
  tablePagination.current = 1;
  fetchClassData();
}

function handleReset() {
  filters.dateRange = [dayjs().startOf('month'), dayjs().endOf('month')];
  filters.campusId = undefined;
  filters.courseType = undefined;
  tablePagination.current = 1;
  fetchClassData();
}

function handleTableChange(pagination: typeof tablePagination) {
  tablePagination.current = pagination.current;
  tablePagination.pageSize = pagination.pageSize;
}

function handleExport() {
  message.info('导出功能开发中...');
}

// ============================================================
// 工具函数
// ============================================================

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcRetentionRate(record: ClassRankItem): number {
  if (record.payCount === 0) return 0;
  return ((record.payCount - record.refundCount) / record.payCount) * 100;
}

function getRetentionColor(rate: number): string {
  if (rate >= 90) return '#52c41a';
  if (rate >= 70) return '#1890ff';
  if (rate >= 50) return '#faad14';
  return '#ff4d4f';
}

// ============================================================
// 监听与生命周期
// ============================================================

watch(chartMetric, () => {
  renderChart();
});

onMounted(() => {
  initChart();
  loadData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  barChart?.dispose();
});
</script>

<style scoped>
.class-management {
  padding: 24px;
  background-color: var(--bg-color);
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.kpi-row {
  margin-bottom: 24px;
}

.kpi-card {
  border-radius: 8px;
  height: 100%;
}

.kpi-card :deep(.ant-statistic-title) {
  font-size: 13px;
  color: var(--text-secondary);
}

.kpi-card :deep(.ant-statistic-content) {
  font-size: 20px;
}

.chart-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.bar-chart-container {
  height: 400px;
  width: 100%;
}

.table-card {
  border-radius: 8px;
}

.class-name {
  font-weight: 500;
  color: var(--text-primary);
}

.amount-positive {
  color: var(--success-color);
  font-weight: 500;
}

.amount-negative {
  color: var(--warning-color);
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .class-management {
    padding: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .kpi-card :deep(.ant-statistic-content) {
    font-size: 16px;
  }

  .bar-chart-container {
    height: 300px;
  }
}
</style>