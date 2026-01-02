<template>
  <div class="refund-details-page">
    <!-- 筛选区 -->
    <a-card :bordered="false" style="margin-bottom: 16px;">
      <div class="filter-title">退费明细统计表</div>
      <div class="filter-subtitle">用途：退费原因分析、风控、异常监控</div>

      <a-row :gutter="[12, 12]" style="margin-top: 16px;">
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="filter-label">退费日期范围</div>
          <a-range-picker
            v-model:value="filters.range"
            style="width: 100%;"
            :disabled="loading"
          />
        </a-col>

        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="filter-label">校区（可选）</div>
          <a-select
            v-model:value="filters.campusId"
            allowClear
            placeholder="全部校区"
            style="width: 100%;"
            :disabled="loading"
          >
            <a-select-option v-for="c in meta.campuses" :key="c.id" :value="c.id">
              {{ c.name }}
            </a-select-option>
          </a-select>
        </a-col>

        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="filter-label">课型（可选）</div>
          <a-select
            v-model:value="filters.courseType"
            allowClear
            placeholder="全部课型"
            style="width: 100%;"
            :disabled="loading"
          >
            <a-select-option v-for="t in meta.courseTypes" :key="t" :value="t">
              {{ t }}
            </a-select-option>
          </a-select>
        </a-col>

        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="filter-label">班级ID（可选）</div>
          <a-input
            v-model:value="filters.classId"
            placeholder="输入班级ID"
            allowClear
            :disabled="loading"
          />
        </a-col>

        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="filter-label">班主任ID（可选）</div>
          <a-input
            v-model:value="filters.teacherId"
            placeholder="输入班主任ID"
            allowClear
            :disabled="loading"
          />
        </a-col>
      </a-row>

      <a-row style="margin-top: 16px;">
        <a-space>
          <a-button type="primary" :loading="loading" @click="handleSearch">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button :disabled="loading" @click="handleReset">
            <template #icon><ReloadOutlined /></template>
            重置
          </a-button>
          <a-button
            :disabled="loading || !dataSource.length"
            @click="handleExport"
            danger
          >
            <template #icon><DownloadOutlined /></template>
            导出当前页
          </a-button>
        </a-space>
      </a-row>
    </a-card>

    <!-- 风险指标卡片 -->
    <a-card :bordered="false" style="margin-bottom: 16px;">
      <a-row :gutter="16">
        <a-col :xs="12" :sm="8" :md="6">
          <a-statistic
            title="总退费人数"
            :value="summary.totalRefundCount"
            :value-style="{ color: '#ff4d4f' }"
          />
        </a-col>
        <a-col :xs="12" :sm="8" :md="6">
          <a-statistic
            title="总退费金额"
            :value="summary.totalRefundAmount"
            :precision="2"
            suffix="元"
            :value-style="{ color: '#ff4d4f' }"
          />
        </a-col>
        <a-col :xs="12" :sm="8" :md="6">
          <a-statistic
            title="退费记录条数"
            :value="pagination.total"
            :value-style="{ color: '#faad14' }"
          />
        </a-col>
        <a-col :xs="12" :sm="8" :md="6">
          <a-statistic
            title="人均退费"
            :value="summary.avgRefundAmount"
            :precision="2"
            suffix="元"
          />
        </a-col>
      </a-row>
    </a-card>

    <!-- 数据表格 -->
    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1200 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'refundDate'">
            <span>{{ formatDate(record.refundDate) }}</span>
          </template>
          <template v-else-if="column.key === 'refundAmount'">
            <span style="color: #ff4d4f; font-weight: 500;">
              ¥{{ formatNumber(record.refundAmount) }}
            </span>
          </template>
          <template v-else-if="column.key === 'className'">
            <a-tag color="orange">{{ record.className }}</a-tag>
          </template>
          <template v-else-if="column.key === 'refundReason'">
            <a-tooltip v-if="record.refundReason" :title="record.refundReason">
              <span style="cursor: help;">
                {{ truncateText(record.refundReason, 20) }}
              </span>
            </a-tooltip>
            <span v-else style="color: rgba(0,0,0,0.25);">-</span>
          </template>
          <template v-else-if="column.key === 'risk'">
            <a-tag v-if="record.refundCount >= 3" color="red">
              高风险
            </a-tag>
            <a-tag v-else-if="record.refundCount >= 2" color="orange">
              中风险
            </a-tag>
            <a-tag v-else color="green">
              正常
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons-vue';
import dayjs, { Dayjs } from 'dayjs';
import type { TableProps, TablePaginationConfig } from 'ant-design-vue';
import { getRefundDetails } from '@/api/dashboard';
import type { RefundDetailItem, RefundDetailsQueryParams } from '@/api/dashboard';
import { getMeta } from '@/api/meta';
import type { Campus } from '@/api/meta';

// ============================================================
// 数据状态
// ============================================================

const loading = ref(false);

const meta = reactive({
  campuses: [] as Campus[],
  courseTypes: ['PS', 'S', 'KET', 'PET', 'FCE', 'CAE'] as string[],
});

const filters = reactive<{
  range: [Dayjs, Dayjs] | null;
  campusId?: string;
  courseType?: string;
  classId?: string;
  teacherId?: string;
}>({
  range: [dayjs().startOf('month'), dayjs().endOf('month')],
  campusId: undefined,
  courseType: undefined,
  classId: undefined,
  teacherId: undefined,
});

const dataSource = ref<RefundDetailItem[]>([]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
  pageSizeOptions: ['10', '20', '50', '100'],
});

// 统计汇总
const summary = computed(() => {
  const totalRefundCount = dataSource.value.reduce((sum, item) => sum + item.refundCount, 0);
  const totalRefundAmount = dataSource.value.reduce((sum, item) => sum + item.refundAmount, 0);
  const avgRefundAmount = totalRefundCount > 0 ? totalRefundAmount / totalRefundCount : 0;

  return {
    totalRefundCount,
    totalRefundAmount,
    avgRefundAmount,
  };
});

// ============================================================
// 表格配置
// ============================================================

const columns: TableProps['columns'] = [
  {
    title: '退费日期',
    dataIndex: 'refundDate',
    key: 'refundDate',
    width: 120,
    fixed: 'left',
  },
  {
    title: '班级',
    dataIndex: 'className',
    key: 'className',
    width: 150,
  },
  {
    title: '班主任',
    dataIndex: 'teacherName',
    key: 'teacherName',
    width: 100,
  },
  {
    title: '校区',
    dataIndex: 'campusName',
    key: 'campusName',
    width: 120,
  },
  {
    title: '课型',
    dataIndex: 'courseType',
    key: 'courseType',
    width: 80,
  },
  {
    title: '退费人数',
    dataIndex: 'refundCount',
    key: 'refundCount',
    width: 100,
    align: 'right',
  },
  {
    title: '退费金额',
    dataIndex: 'refundAmount',
    key: 'refundAmount',
    width: 120,
    align: 'right',
  },
  {
    title: '退费原因',
    dataIndex: 'refundReason',
    key: 'refundReason',
    width: 200,
    ellipsis: true,
  },
  {
    title: '风险等级',
    key: 'risk',
    width: 100,
    align: 'center',
  },
];

// ============================================================
// 业务逻辑
// ============================================================

function buildQueryParams(): RefundDetailsQueryParams {
  const [start, end] = filters.range ?? [
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ];

  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
    campusId: filters.campusId,
    courseType: filters.courseType,
    classId: filters.classId,
    teacherId: filters.teacherId,
    page: pagination.current,
    pageSize: pagination.pageSize,
  };
}

async function fetchData() {
  loading.value = true;
  try {
    const params = buildQueryParams();
    const response = await getRefundDetails(params);

    dataSource.value = response.data.items;
    pagination.total = response.data.total;
    pagination.current = response.data.page;
    pagination.pageSize = response.data.pageSize;
  } catch (error: any) {
    message.error(error?.message || '获取数据失败');
    console.error('获取退费明细失败:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchMeta() {
  try {
    const metaData = await getMeta();
    meta.campuses = metaData.campuses;
    meta.courseTypes = metaData.courseTypes;
  } catch (error: any) {
    console.error('获取元数据失败:', error);
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  filters.range = [dayjs().startOf('month'), dayjs().endOf('month')];
  filters.campusId = undefined;
  filters.courseType = undefined;
  filters.classId = undefined;
  filters.teacherId = undefined;
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  fetchData();
}

function handleExport() {
  // 简单导出为 CSV
  const headers = ['退费日期', '班级', '班主任', '校区', '课型', '退费人数', '退费金额', '退费原因'];
  const rows = dataSource.value.map(item => [
    formatDate(item.refundDate),
    item.className,
    item.teacherName,
    item.campusName || '-',
    item.courseType || '-',
    item.refundCount,
    item.refundAmount,
    item.refundReason ? `"${item.refundReason.replace(/"/g, '""')}"` : '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `退费明细_${dayjs().format('YYYYMMDDHHmmss')}.csv`;
  link.click();

  message.success('导出成功');
}

// ============================================================
// 工具函数
// ============================================================

function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD');
}

function formatNumber(num: number): string {
  return num.toFixed(2);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ============================================================
// 生命周期
// ============================================================

onMounted(() => {
  fetchMeta();
  fetchData();
});
</script>

<style scoped>
.refund-details-page {
  padding: 16px;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.filter-subtitle {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
}

.filter-label {
  font-weight: 500;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.65);
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

:deep(.ant-statistic-content) {
  font-size: 20px;
}
</style>