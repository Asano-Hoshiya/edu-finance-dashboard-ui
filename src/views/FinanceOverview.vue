<template>
  <div class="finance-overview">
    <div class="page-header">
      <h2>财务概览</h2>
      <a-space>
        <a-range-picker
          v-model:value="dateRange"
          :placeholder="['开始日期', '结束日期']"
          style="width: 260px"
        />
        <a-button type="primary" @click="handleRefresh">
          <template #icon><ReloadOutlined /></template>
          刷新数据
        </a-button>
      </a-space>
    </div>

    <!-- 核心指标卡片 -->
    <a-row :gutter="[16, 16]" class="kpi-section">
      <a-col :xs="24" :sm="12" :lg="6" v-for="kpi in kpiData" :key="kpi.title">
        <a-card hoverable>
          <a-statistic
            :title="kpi.title"
            :value="kpi.value"
            :precision="kpi.precision"
            :prefix="kpi.prefix"
            :suffix="kpi.suffix"
            :value-style="{ color: kpi.color }"
          />
          <div class="kpi-trend">
            <span :class="['trend', kpi.trend > 0 ? 'up' : 'down']">
              <component :is="kpi.trend > 0 ? 'ArrowUpOutlined' : 'ArrowDownOutlined'" />
              {{ Math.abs(kpi.trend) }}%
            </span>
            <span class="compare">较上月</span>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表区域 -->
    <a-row :gutter="[16, 16]" class="chart-section">
      <a-col :xs="24" :lg="16">
        <a-card title="收入支出趋势" :bordered="false">
          <div ref="lineChartRef" class="chart-container"></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="8">
        <a-card title="收入构成" :bordered="false">
          <div ref="pieChartRef" class="chart-container"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最近交易记录 -->
    <a-card title="最近交易记录" :bordered="false" class="table-section">
      <a-table
        :columns="transactionColumns"
        :data-source="transactionData"
        :pagination="{ pageSize: 5 }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="record.type === '收入' ? 'green' : 'red'">
              {{ record.type }}
            </a-tag>
          </template>
          <template v-if="column.key === 'amount'">
            <span :style="{ color: record.type === '收入' ? '#52c41a' : '#ff4d4f' }">
              {{ record.type === '收入' ? '+' : '-' }}¥{{ record.amount.toLocaleString() }}
            </span>
          </template>
          <template v-if="column.key === 'status'">
            <a-badge
              :status="record.status === '已完成' ? 'success' : 'processing'"
              :text="record.status"
            />
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import type { Dayjs } from 'dayjs'

// 日期范围
const dateRange = ref<[Dayjs, Dayjs] | null>(null)

// KPI 数据
const kpiData = ref([
  {
    title: '本月总收入',
    value: 1258600,
    precision: 2,
    prefix: '¥',
    suffix: '',
    color: '#52c41a',
    trend: 12.5
  },
  {
    title: '本月总支出',
    value: 456800,
    precision: 2,
    prefix: '¥',
    suffix: '',
    color: '#ff4d4f',
    trend: -3.2
  },
  {
    title: '净收入',
    value: 801800,
    precision: 2,
    prefix: '¥',
    suffix: '',
    color: '#1890ff',
    trend: 18.7
  },
  {
    title: '收款率',
    value: 94.5,
    precision: 1,
    prefix: '',
    suffix: '%',
    color: '#722ed1',
    trend: 2.1
  }
])

// 图表 refs
const lineChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

// 交易记录表格列
const transactionColumns = [
  { title: '交易编号', dataIndex: 'id', key: 'id' },
  { title: '交易类型', dataIndex: 'type', key: 'type' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '金额', dataIndex: 'amount', key: 'amount' },
  { title: '时间', dataIndex: 'time', key: 'time' },
  { title: '状态', dataIndex: 'status', key: 'status' }
]

// Mock 交易数据
const transactionData = ref([
  { id: 'TXN001', type: '收入', description: '学费缴纳 - 张三', amount: 12800, time: '2024-01-15 10:30', status: '已完成' },
  { id: 'TXN002', type: '收入', description: '学费缴纳 - 李四', amount: 12800, time: '2024-01-15 11:20', status: '已完成' },
  { id: 'TXN003', type: '支出', description: '教师工资发放', amount: 85000, time: '2024-01-14 15:00', status: '已完成' },
  { id: 'TXN004', type: '收入', description: '教材费 - 王五', amount: 580, time: '2024-01-14 09:45', status: '处理中' },
  { id: 'TXN005', type: '支出', description: '办公用品采购', amount: 2350, time: '2024-01-13 14:30', status: '已完成' }
])

// 初始化折线图
const initLineChart = () => {
  if (!lineChartRef.value) return

  lineChart = echarts.init(lineChartRef.value)
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['收入', '支出', '净收入']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => (value / 10000) + '万'
      }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330].map(v => v * 1000),
        itemStyle: { color: '#52c41a' },
        areaStyle: { color: 'rgba(82, 196, 26, 0.1)' }
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        data: [80, 72, 91, 84, 70, 130, 110, 92, 101, 114, 120, 140].map(v => v * 1000),
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { color: 'rgba(255, 77, 79, 0.1)' }
      },
      {
        name: '净收入',
        type: 'line',
        smooth: true,
        data: [40, 60, 10, 50, 20, 100, 100, 90, 90, 120, 170, 190].map(v => v * 1000),
        itemStyle: { color: '#1890ff' },
        areaStyle: { color: 'rgba(24, 144, 255, 0.1)' }
      }
    ]
  }
  lineChart.setOption(option)
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChartRef.value) return

  pieChart = echarts.init(pieChartRef.value)
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '收入构成',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: 735000, name: '学费', itemStyle: { color: '#1890ff' } },
          { value: 280000, name: '培训费', itemStyle: { color: '#52c41a' } },
          { value: 158000, name: '教材费', itemStyle: { color: '#722ed1' } },
          { value: 85600, name: '其他', itemStyle: { color: '#faad14' } }
        ]
      }
    ]
  }
  pieChart.setOption(option)
}

// 刷新数据
const handleRefresh = () => {
  message.success('数据已刷新')
}

// 窗口 resize 处理
const handleResize = () => {
  lineChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  initLineChart()
  initPieChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  pieChart?.dispose()
})
</script>

<style scoped lang="less">
.finance-overview {
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

.kpi-section {
  margin-bottom: 16px;

  .kpi-trend {
    margin-top: 12px;
    font-size: 12px;

    .trend {
      margin-right: 8px;

      &.up {
        color: #52c41a;
      }

      &.down {
        color: #ff4d4f;
      }
    }

    .compare {
      color: #999;
    }
  }
}

.chart-section {
  margin-bottom: 16px;

  .chart-container {
    height: 350px;
  }
}

.table-section {
  margin-bottom: 16px;
}
</style>