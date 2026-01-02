<template>
  <div class="pivot-table-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">日期 × 班级 交叉统计表</h2>
      <p class="page-desc">按日期和班级维度查看财务数据，支持多班级合并统计</p>
    </div>

    <!-- 筛选区域 -->
    <a-card class="filter-card" :bordered="false">
      <a-form layout="inline" :model="filters">
        <a-row :gutter="[16, 16]" style="width: 100%">
          <!-- 时间范围 -->
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="时间范围">
              <a-range-picker
                v-model:value="filters.dateRange"
                :placeholder="['开始日期', '结束日期']"
                style="width: 100%"
                :allow-clear="false"
              />
            </a-form-item>
          </a-col>

          <!-- 校区 -->
          <a-col :xs="24" :sm="12" :md="8" :lg="5">
            <a-form-item label="校区">
              <a-select
                v-model:value="filters.campusId"
                placeholder="全部校区"
                allow-clear
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
            </a-form-item>
          </a-col>

          <!-- 课型 -->
          <a-col :xs="24" :sm="12" :md="8" :lg="5">
            <a-form-item label="课型">
              <a-select
                v-model:value="filters.courseType"
                placeholder="全部课型"
                allow-clear
                style="width: 100%"
              >
                <a-select-option
                  v-for="type in meta.courseTypes"
                  :key="type"
                  :value="type"
                >
                  {{ type }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <!-- 统计指标 -->
          <a-col :xs="24" :sm="12" :md="8" :lg="5">
            <a-form-item label="统计指标">
              <a-select
                v-model:value="filters.metric"
                style="width: 100%"
              >
                <a-select-option value="netAmount">净收入</a-select-option>
                <a-select-option value="payAmount">实缴金额</a-select-option>
                <a-select-option value="refundAmount">退费金额</a-select-option>
                <a-select-option value="payCount">缴费人数</a-select-option>
                <a-select-option value="refundCount">退费人数</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <!-- 操作按钮 -->
          <a-col :xs="24" :sm="24" :md="8" :lg="3">
            <a-form-item>
              <a-space>
                <a-button type="primary" :loading="loading" @click="handleQuery">
                  <template #icon><SearchOutlined /></template>
                  查询
                </a-button>
                <a-button @click="handleReset">
                  <template #icon><ReloadOutlined /></template>
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 班级多选 -->
        <a-row style="margin-top: 16px">
          <a-col :span="24">
            <a-form-item label="筛选班级">
              <a-select
                v-model:value="filters.classIds"
                mode="multiple"
                placeholder="可选择多个班级进行合并统计（留空显示全部）"
                allow-clear
                style="width: 100%"
                :max-tag-count="5"
                :options="classOptions"
                :filter-option="filterClassOption"
                show-search
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 数据表格 -->
    <a-card class="table-card" :bordered="false">
      <!-- 工具栏 -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="data-info">
            共 <strong>{{ pivotData.rows.length }}</strong> 天，
            <strong>{{ pivotData.columns.length - 1 }}</strong> 个班级
          </span>
        </div>
        <div class="toolbar-right">
          <a-button @click="handleExport" :disabled="pivotData.rows.length === 0">
            <template #icon><DownloadOutlined /></template>
            导出 Excel
          </a-button>
        </div>
      </div>

      <!-- Pivot 表格 -->
      <div class="pivot-table-wrapper">
        <a-table
          :columns="tableColumns"
          :data-source="tableData"
          :loading="loading"
          :pagination="paginationConfig"
          :scroll="{ x: scrollX }"
          row-key="date"
          size="middle"
          bordered
          @change="handleTableChange"
        >
          <!-- 日期列 -->
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'date'">
              <span class="date-cell">{{ formatDate(record.date) }}</span>
            </template>
            <template v-else-if="column.dataIndex === '_total'">
              <span class="total-cell">{{ formatValue(record.values['_total']) }}</span>
            </template>
            <template v-else>
              <span :class="getCellClass(record.values[column.dataIndex])">
                {{ formatValue(record.values[column.dataIndex]) }}
              </span>
            </template>
          </template>

          <!-- 合计行 -->
          <template #summary>
            <a-table-summary fixed>
              <a-table-summary-row class="summary-row">
                <a-table-summary-cell :index="0" class="summary-label">
                  <strong>合计</strong>
                </a-table-summary-cell>
                <a-table-summary-cell
                  v-for="(col, index) in pivotData.columns"
                  :key="col.classId"
                  :index="index + 1"
                  :class="col.classId === '_total' ? 'summary-total' : ''"
                >
                  <strong>{{ formatValue(pivotData.totals[col.classId]) }}</strong>
                </a-table-summary-cell>
              </a-table-summary-row>
            </a-table-summary>
          </template>

          <!-- 空状态 -->
          <template #emptyText>
            <a-empty description="暂无数据，请调整筛选条件后查询" />
          </template>
        </a-table>
      </div>
    </a-card>

    <!-- 使用说明 -->
    <a-card class="help-card" :bordered="false">
      <a-collapse :bordered="false" ghost>
        <a-collapse-panel key="1" header="使用说明">
          <ul class="help-list">
            <li><strong>行维度：</strong>日期（按天统计）</li>
            <li><strong>列维度：</strong>班级（可多选合并统计）</li>
            <li><strong>单元格：</strong>所选指标的聚合值</li>
            <li><strong>合计列：</strong>每天所有班级的汇总</li>
            <li><strong>合计行：</strong>每个班级在时间范围内的汇总</li>
            <li><strong>用途：</strong>不同班级数据合并统计，如统计所有 KET 班级的情况</li>
          </ul>
        </a-collapse-panel>
      </a-collapse>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons-vue';
import dayjs, { Dayjs } from 'dayjs';
import type { TableColumnType, TablePaginationConfig } from 'ant-design-vue';

import { getMeta, type Campus } from '@/api/meta';
import {
  getPivot,
  type PivotData,
  type PivotColumn,
  type PivotRow,
  type PivotQueryParams,
} from '@/api/dashboard';

// ============================================================
// 状态定义
// ============================================================

const loading = ref(false);

/** 元数据 */
const meta = reactive<{
  campuses: Campus[];
  courseTypes: string[];
}>({
  campuses: [],
  courseTypes: [],
});

/** 班级选项（从已有数据中提取） */
const classOptions = ref<{ label: string; value: string }[]>([]);

/** 筛选条件 */
const filters = reactive<{
  dateRange: [Dayjs, Dayjs];
  campusId: string | undefined;
  courseType: string | undefined;
  metric: 'netAmount' | 'payAmount' | 'refundAmount' | 'payCount' | 'refundCount';
  classIds: string[];
}>({
  dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
  campusId: undefined,
  courseType: undefined,
  metric: 'netAmount',
  classIds: [],
});

/** Pivot 数据 */
const pivotData = reactive<PivotData>({
  columns: [],
  rows: [],
  totals: {},
});

/** 分页配置 */
const paginationConfig = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total: number) => `共 ${total} 条`,
});

// ============================================================
// 计算属性
// ============================================================

/** 表格列定义 */
const tableColumns = computed<TableColumnType[]>(() => {
  const cols: TableColumnType[] = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      fixed: 'left',
      sorter: (a: PivotRow, b: PivotRow) => a.date.localeCompare(b.date),
    },
  ];

  // 动态添加班级列
  pivotData.columns.forEach((col: PivotColumn) => {
    cols.push({
      title: col.classDisplay,
      dataIndex: col.classId,
      key: col.classId,
      width: 120,
      align: 'right',
      fixed: col.classId === '_total' ? 'right' : undefined,
      sorter: (a: PivotRow, b: PivotRow) =>
        (a.values[col.classId] || 0) - (b.values[col.classId] || 0),
    });
  });

  return cols;
});

/** 表格数据 */
const tableData = computed(() => pivotData.rows);

/** 横向滚动宽度 */
const scrollX = computed(() => {
  // 日期列 120 + 每个班级列 120 + 合计列 120
  return 120 + pivotData.columns.length * 120;
});

/** 指标名称映射 */
const metricLabels: Record<string, string> = {
  netAmount: '净收入',
  payAmount: '实缴金额',
  refundAmount: '退费金额',
  payCount: '缴费人数',
  refundCount: '退费人数',
};

// ============================================================
// 方法
// ============================================================

/** 构建查询参数 */
function buildQueryParams(): PivotQueryParams {
  const [start, end] = filters.dateRange;
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
    campusId: filters.campusId,
    courseType: filters.courseType,
    metric: filters.metric,
    classIds: filters.classIds.length > 0 ? filters.classIds : undefined,
  };
}

/** 加载元数据 */
async function loadMeta() {
  try {
    const data = await getMeta();
    meta.campuses = data.campuses;
    meta.courseTypes = data.courseTypes;
  } catch (error) {
    console.error('加载元数据失败:', error);
    message.error('加载元数据失败');
  }
}

/** 加载 Pivot 数据 */
async function loadPivotData() {
  loading.value = true;
  try {
    const params = buildQueryParams();
    const response = await getPivot(params);

    if (response.code === 0) {
      pivotData.columns = response.data.columns;
      pivotData.rows = response.data.rows;
      pivotData.totals = response.data.totals;
      paginationConfig.total = response.data.rows.length;

      // 更新班级选项
      updateClassOptions(response.data.columns);
    } else {
      message.error(response.message || '加载数据失败');
    }
  } catch (error) {
    console.error('加载 Pivot 数据失败:', error);
    message.error('加载数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

/** 更新班级选项 */
function updateClassOptions(columns: PivotColumn[]) {
  classOptions.value = columns
    .filter((col) => col.classId !== '_total')
    .map((col) => ({
      label: col.classDisplay,
      value: col.classId,
    }));
}

/** 班级筛选 */
function filterClassOption(input: string, option: { label: string; value: string }) {
  return option.label.toLowerCase().includes(input.toLowerCase());
}

/** 查询 */
function handleQuery() {
  paginationConfig.current = 1;
  loadPivotData();
}

/** 重置 */
function handleReset() {
  filters.dateRange = [dayjs().startOf('month'), dayjs().endOf('month')];
  filters.campusId = undefined;
  filters.courseType = undefined;
  filters.metric = 'netAmount';
  filters.classIds = [];
  paginationConfig.current = 1;
  loadPivotData();
}

/** 表格分页变化 */
function handleTableChange(pagination: TablePaginationConfig) {
  paginationConfig.current = pagination.current || 1;
  paginationConfig.pageSize = pagination.pageSize || 20;
}

/** 格式化日期 */
function formatDate(date: string): string {
  return dayjs(date).format('MM-DD (ddd)');
}

/** 格式化数值 */
function formatValue(value: number | undefined): string {
  if (value === undefined || value === null) {
    return '-';
  }
  // 人数类指标显示整数
  if (filters.metric === 'payCount' || filters.metric === 'refundCount') {
    return value.toLocaleString('zh-CN');
  }
  // 金额类指标显示两位小数
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 获取单元格样式类 */
function getCellClass(value: number | undefined): string {
  if (value === undefined || value === null || value === 0) {
    return 'cell-zero';
  }
  if (filters.metric === 'refundAmount' || filters.metric === 'refundCount') {
    return value > 0 ? 'cell-negative' : '';
  }
  return value > 0 ? 'cell-positive' : '';
}

/** 导出 Excel */
function handleExport() {
  if (pivotData.rows.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }

  // 构建 CSV 内容
  const headers = ['日期', ...pivotData.columns.map((c) => c.classDisplay)];
  const rows = pivotData.rows.map((row) => [
    row.date,
    ...pivotData.columns.map((col) => row.values[col.classId] ?? ''),
  ]);

  // 添加合计行
  rows.push([
    '合计',
    ...pivotData.columns.map((col) => pivotData.totals[col.classId] ?? ''),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  // 添加 BOM 以支持中文
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Pivot表_${metricLabels[filters.metric]}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  message.success('导出成功');
}

// ============================================================
// 生命周期
// ============================================================

onMounted(async () => {
  await loadMeta();
  await loadPivotData();
});
</script>

<style scoped>
.pivot-table-page {
  padding: 24px;
  background: var(--bg-secondary, #f5f7fa);
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #1a1a2e);
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: var(--text-muted, #8c8c8c);
  margin: 0;
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-card :deep(.ant-form-item) {
  margin-bottom: 0;
}

.filter-card :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: var(--text-secondary, #666);
}

.table-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #e8e8e8);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.data-info {
  font-size: 14px;
  color: var(--text-secondary, #666);
}

.data-info strong {
  color: var(--primary-color, #667eea);
}

.pivot-table-wrapper {
  overflow: hidden;
}

.pivot-table-wrapper :deep(.ant-table) {
  font-size: 13px;
}

.pivot-table-wrapper :deep(.ant-table-thead > tr > th) {
  background: var(--bg-tertiary, #fafafa);
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.pivot-table-wrapper :deep(.ant-table-tbody > tr > td) {
  text-align: right;
}

.pivot-table-wrapper :deep(.ant-table-tbody > tr > td:first-child) {
  text-align: center;
  font-weight: 500;
}

.date-cell {
  font-weight: 500;
  color: var(--text-primary, #1a1a2e);
}

.total-cell {
  font-weight: 600;
  color: var(--primary-color, #667eea);
  background: rgba(102, 126, 234, 0.05);
}

.cell-zero {
  color: var(--text-muted, #bfbfbf);
}

.cell-positive {
  color: var(--success-color, #52c41a);
}

.cell-negative {
  color: var(--danger-color, #ff4d4f);
}

.summary-row {
  background: var(--bg-tertiary, #fafafa);
}

.summary-row :deep(.ant-table-cell) {
  text-align: right;
}

.summary-label {
  text-align: center !important;
}

.summary-total {
  background: rgba(102, 126, 234, 0.08);
  color: var(--primary-color, #667eea);
}

.help-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.help-card :deep(.ant-collapse-header) {
  font-weight: 500;
  color: var(--text-secondary, #666);
}

.help-list {
  margin: 0;
  padding-left: 20px;
  line-height: 2;
  color: var(--text-secondary, #666);
}

.help-list li strong {
  color: var(--text-primary, #1a1a2e);
}

/* 响应式 */
@media (max-width: 768px) {
  .pivot-table-page {
    padding: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .table-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>