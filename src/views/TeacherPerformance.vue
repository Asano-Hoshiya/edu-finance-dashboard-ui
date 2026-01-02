<!-- src/views/TeacherPerformance.vue -->
<template>
  <div class="teacher-performance">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">班主任绩效统计表</h2>
      <p class="page-desc">查看班主任的招生业绩与退费情况</p>
    </div>

    <!-- 筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle">
        <!-- 时间粒度切换 -->
        <a-col :xs="24" :sm="8" :md="6">
          <div class="filter-label">统计周期</div>
          <a-radio-group v-model:value="periodType" button-style="solid" @change="handlePeriodChange">
            <a-radio-button value="month">按月</a-radio-button>
            <a-radio-button value="year">按年</a-radio-button>
          </a-radio-group>
        </a-col>

        <!-- 月份选择器 -->
        <a-col :xs="24" :sm="8" :md="6" v-if="periodType === 'month'">
          <div class="filter-label">选择月份</div>
          <a-date-picker
            v-model:value="selectedMonth"
            picker="month"
            :allowClear="false"
            style="width: 100%"
            format="YYYY年MM月"
            valueFormat="YYYY-MM"
          />
        </a-col>

        <!-- 年份选择器 -->
        <a-col :xs="24" :sm="8" :md="6" v-if="periodType === 'year'">
          <div class="filter-label">选择年份</div>
          <a-date-picker
            v-model:value="selectedYear"
            picker="year"
            :allowClear="false"
            style="width: 100%"
            format="YYYY年"
            valueFormat="YYYY"
          />
        </a-col>

        <!-- 校区筛选 -->
        <a-col :xs="24" :sm="8" :md="6">
          <div class="filter-label">校区</div>
          <a-select
            v-model:value="campusId"
            placeholder="全部校区"
            allowClear
            style="width: 100%"
          >
            <a-select-option v-for="c in campuses" :key="c.id" :value="c.id">
              {{ c.name }}
            </a-select-option>
          </a-select>
        </a-col>

        <!-- 操作按钮 -->
        <a-col :xs="24" :sm="24" :md="6" class="filter-actions">
          <a-space>
            <a-button type="primary" :loading="loading" @click="fetchData">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button @click="resetFilters">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
            <a-button @click="exportExcel">
              <template #icon><DownloadOutlined /></template>
              导出
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </a-card>

    <!-- 统计汇总卡片 -->
    <a-row :gutter="16" class="summary-row">
      <a-col :xs="12" :sm="6">
        <a-card :bordered="false" class="summary-card">
          <a-statistic
            title="班主任总数"
            :value="summaryStats.teacherCount"
            :valueStyle="{ color: '#1890ff' }"
          >
            <template #suffix>人</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card :bordered="false" class="summary-card">
          <a-statistic
            title="总缴费人数"
            :value="summaryStats.totalPayCount"
            :valueStyle="{ color: '#52c41a' }"
          >
            <template #suffix>人</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card :bordered="false" class="summary-card">
          <a-statistic
            title="总缴费金额"
            :value="summaryStats.totalPayAmount"
            :precision="2"
            :valueStyle="{ color: '#52c41a' }"
          >
            <template #prefix>¥</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card :bordered="false" class="summary-card">
          <a-statistic
            title="平均退费率(人数)"
            :value="summaryStats.avgRefundRateByCount * 100"
            :precision="2"
            :valueStyle="{ color: summaryStats.avgRefundRateByCount > 0.15 ? '#ff4d4f' : '#52c41a' }"
          >
            <template #suffix>%</template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 数据表格 -->
    <a-card :bordered="false" class="table-card">
      <template #title>
        <span>绩效明细</span>
        <a-tag color="blue" style="margin-left: 8px">
          {{ periodType === 'month' ? selectedMonth : selectedYear }}
        </a-tag>
      </template>
      <template #extra>
        <a-space>
          <span class="record-count">共 {{ tableData.length }} 条记录</span>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1200 }"
        row-key="teacherId"
        size="middle"
        @change="handleTableChange"
      >
        <!-- 班主任姓名 -->
        <template #bodyCell="{ column, record, index }">
          <!-- 序号 -->
          <template v-if="column.dataIndex === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>

          <!-- 班主任姓名带排名标记 -->
          <template v-else-if="column.dataIndex === 'teacherName'">
            <div class="teacher-name-cell">
              <a-avatar
                :style="{ backgroundColor: getAvatarColor(record.teacherName) }"
                size="small"
              >
                {{ record.teacherName?.charAt(0) }}
              </a-avatar>
              <span class="name-text">{{ record.teacherName }}</span>
              <a-tag v-if="index < 3 && pagination.current === 1" :color="getRankColor(index)">
                TOP{{ index + 1 }}
              </a-tag>
            </div>
          </template>

          <!-- 管理班级数 -->
          <template v-else-if="column.dataIndex === 'classCount'">
            <span>{{ record.classCount }}</span>
          </template>

          <!-- 缴费人数 -->
          <template v-else-if="column.dataIndex === 'payCount'">
            <span class="value-positive">{{ record.payCount }}</span>
          </template>

          <!-- 退费人数 -->
          <template v-else-if="column.dataIndex === 'refundCount'">
            <span :class="record.refundCount > 0 ? 'value-negative' : ''">
              {{ record.refundCount }}
            </span>
          </template>

          <!-- 缴费金额 -->
          <template v-else-if="column.dataIndex === 'payAmount'">
            <span class="value-positive">¥{{ formatNumber(record.payAmount) }}</span>
          </template>

          <!-- 退费金额 -->
          <template v-else-if="column.dataIndex === 'refundAmount'">
            <span :class="record.refundAmount > 0 ? 'value-negative' : ''">
              ¥{{ formatNumber(record.refundAmount) }}
            </span>
          </template>

          <!-- 人数退费率 -->
          <template v-else-if="column.dataIndex === 'refundRateByCount'">
            <a-progress
              :percent="record.refundRateByCount * 100"
              :size="[100, 8]"
              :strokeColor="getRefundRateColor(record.refundRateByCount)"
              :format="(percent: number) => `${percent.toFixed(2)}%`"
            />
          </template>

          <!-- 金额退费率 -->
          <template v-else-if="column.dataIndex === 'refundRateByAmount'">
            <a-progress
              :percent="record.refundRateByAmount * 100"
              :size="[100, 8]"
              :strokeColor="getRefundRateColor(record.refundRateByAmount)"
              :format="(percent: number) => `${percent.toFixed(2)}%`"
            />
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 指标说明 -->
    <a-card :bordered="false" class="note-card">
      <template #title>
        <InfoCircleOutlined style="margin-right: 8px" />
        指标口径说明
      </template>
      <a-descriptions :column="{ xs: 1, sm: 2 }" size="small" bordered>
        <a-descriptions-item label="人数退费率">
          退费人数 ÷ 缴费人数（缴费人数为0时显示0）
        </a-descriptions-item>
        <a-descriptions-item label="金额退费率">
          退费金额 ÷ 缴费金额（缴费金额为0时显示0）
        </a-descriptions-item>
        <a-descriptions-item label="统计时间口径">
          以「缴费日期/退费日期」落在所选时间范围内为准
        </a-descriptions-item>
        <a-descriptions-item label="管理班级数">
          班主任在统计周期内有缴费/退费记录的班级数量
        </a-descriptions-item>
      </a-descriptions>
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
  InfoCircleOutlined,
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { getTeacherRank, type TeacherRankItem, type DashboardQueryParams } from '@/api/dashboard';
import { getMeta, type Campus } from '@/api/meta';

// ============================================================
// 状态定义
// ============================================================

const loading = ref(false);

// 筛选条件
const periodType = ref<'month' | 'year'>('month');
const selectedMonth = ref(dayjs().format('YYYY-MM'));
const selectedYear = ref(dayjs().format('YYYY'));
const campusId = ref<string | undefined>(undefined);

// 元数据
const campuses = ref<Campus[]>([]);

// 表格数据
const tableData = ref<TeacherRankItem[]>([]);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total: number) => `共 ${total} 条`,
});

// ============================================================
// 表格列定义
// ============================================================

const columns = [
  {
    title: '序号',
    dataIndex: 'index',
    width: 60,
    fixed: 'left' as const,
  },
  {
    title: '班主任',
    dataIndex: 'teacherName',
    width: 160,
    fixed: 'left' as const,
  },
  {
    title: '管理班级数',
    dataIndex: 'classCount',
    width: 110,
    align: 'center' as const,
    sorter: (a: TeacherRankItem, b: TeacherRankItem) => a.classCount - b.classCount,
  },
  {
    title: '缴费人数',
    dataIndex: 'payCount',
    width: 100,
    align: 'right' as const,
    sorter: (a: TeacherRankItem, b: TeacherRankItem) => a.payCount - b.payCount,
  },
  {
    title: '退费人数',
    dataIndex: 'refundCount',
    width: 100,
    align: 'right' as const,
    sorter: (a: TeacherRankItem, b: TeacherRankItem) => a.refundCount - b.refundCount,
  },
  {
    title: '缴费金额',
    dataIndex: 'payAmount',
    width: 130,
    align: 'right' as const,
    sorter: (a: TeacherRankItem, b: TeacherRankItem) => a.payAmount - b.payAmount,
  },
  {
    title: '退费金额',
    dataIndex: 'refundAmount',
    width: 130,
    align: 'right' as const,
    sorter: (a: TeacherRankItem, b: TeacherRankItem) => a.refundAmount - b.refundAmount,
  },
  {
    title: '人数退费率',
    dataIndex: 'refundRateByCount',
    width: 150,
    align: 'center' as const,
    sorter: (a: TeacherRankItem, b: TeacherRankItem) => a.refundRateByCount - b.refundRateByCount,
  },
  {
    title: '金额退费率',
    dataIndex: 'refundRateByAmount',
    width: 150,
    align: 'center' as const,
    sorter: (a: TeacherRankItem, b: TeacherRankItem) => a.refundRateByAmount - b.refundRateByAmount,
  },
];

// ============================================================
// 计算属性
// ============================================================

// 汇总统计
const summaryStats = computed(() => {
  const data = tableData.value;
  if (data.length === 0) {
    return {
      teacherCount: 0,
      totalPayCount: 0,
      totalPayAmount: 0,
      avgRefundRateByCount: 0,
    };
  }

  const totalPayCount = data.reduce((sum, item) => sum + item.payCount, 0);
  const totalPayAmount = data.reduce((sum, item) => sum + item.payAmount, 0);
  const totalRefundCount = data.reduce((sum, item) => sum + item.refundCount, 0);

  return {
    teacherCount: data.length,
    totalPayCount,
    totalPayAmount,
    avgRefundRateByCount: totalPayCount > 0 ? totalRefundCount / totalPayCount : 0,
  };
});

// ============================================================
// 方法
// ============================================================

/**
 * 构建查询参数
 */
function buildQueryParams(): DashboardQueryParams {
  let startDate: string;
  let endDate: string;

  if (periodType.value === 'month') {
    const monthStart = dayjs(selectedMonth.value).startOf('month');
    const monthEnd = dayjs(selectedMonth.value).endOf('month');
    startDate = monthStart.format('YYYY-MM-DD');
    endDate = monthEnd.format('YYYY-MM-DD');
  } else {
    const yearStart = dayjs(selectedYear.value).startOf('year');
    const yearEnd = dayjs(selectedYear.value).endOf('year');
    startDate = yearStart.format('YYYY-MM-DD');
    endDate = yearEnd.format('YYYY-MM-DD');
  }

  return {
    startDate,
    endDate,
    campusId: campusId.value,
  };
}

/**
 * 获取数据
 */
async function fetchData() {
  loading.value = true;
  try {
    const params = buildQueryParams();
    const res = await getTeacherRank(params);

    if (res.code === 0 && res.data) {
      tableData.value = res.data.items || [];
      pagination.total = tableData.value.length;
      pagination.current = 1;
    } else {
      message.error(res.message || '获取数据失败');
    }
  } catch (error) {
    console.error('获取班主任绩效数据失败:', error);
    message.error('获取数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

/**
 * 获取元数据
 */
async function fetchMeta() {
  try {
    const meta = await getMeta();
    campuses.value = meta.campuses || [];
  } catch (error) {
    console.error('获取元数据失败:', error);
  }
}

/**
 * 处理周期切换
 */
function handlePeriodChange() {
  fetchData();
}

/**
 * 重置筛选条件
 */
function resetFilters() {
  periodType.value = 'month';
  selectedMonth.value = dayjs().format('YYYY-MM');
  selectedYear.value = dayjs().format('YYYY');
  campusId.value = undefined;
  fetchData();
}

/**
 * 处理表格变化（分页、排序）
 */
function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
}

/**
 * 导出 Excel
 */
function exportExcel() {
  message.info('导出功能开发中...');
  // TODO: 实现导出逻辑
}

/**
 * 格式化数字（千分位）
 */
function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * 获取头像颜色
 */
function getAvatarColor(name: string): string {
  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#eb2f96',
    '#722ed1', '#13c2c2', '#fa541c', '#2f54eb',
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
}

/**
 * 获取排名标签颜色
 */
function getRankColor(index: number): string {
  const colors = ['#f5222d', '#fa8c16', '#fadb14'];
  return colors[index] || '#d9d9d9';
}

/**
 * 获取退费率颜色
 */
function getRefundRateColor(rate: number): string {
  if (rate >= 0.2) return '#ff4d4f';
  if (rate >= 0.1) return '#faad14';
  return '#52c41a';
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
.teacher-performance {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 8px;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  padding-top: 24px;
}

.summary-row {
  margin-bottom: 24px;
}

.summary-card {
  border-radius: 8px;
  text-align: center;
}

.table-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.record-count {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.teacher-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-text {
  font-weight: 500;
}

.value-positive {
  color: #52c41a;
  font-weight: 500;
}

.value-negative {
  color: #ff4d4f;
  font-weight: 500;
}

.note-card {
  border-radius: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .teacher-performance {
    padding: 16px;
  }

  .filter-actions {
    padding-top: 16px;
    justify-content: flex-start;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>