<template>
  <div class="pivot-table">
    <div class="page-header">
      <h2>数据透视表</h2>
      <a-space>
        <a-button @click="handleExport">
          <template #icon><DownloadOutlined /></template>
          导出数据
        </a-button>
        <a-button type="primary" @click="handleRefresh">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </a-space>
    </div>

    <!-- 维度选择区域 -->
    <a-card title="维度配置" class="config-card" :bordered="false">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :md="6">
          <div class="config-item">
            <label>行维度：</label>
            <a-select
              v-model:value="config.rowDimension"
              style="width: 100%"
              @change="handleConfigChange"
            >
              <a-select-option v-for="dim in dimensionOptions" :key="dim.value" :value="dim.value">
                {{ dim.label }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="config-item">
            <label>列维度：</label>
            <a-select
              v-model:value="config.colDimension"
              style="width: 100%"
              @change="handleConfigChange"
            >
              <a-select-option v-for="dim in dimensionOptions" :key="dim.value" :value="dim.value">
                {{ dim.label }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="config-item">
            <label>度量值：</label>
            <a-select
              v-model:value="config.measure"
              style="width: 100%"
              @change="handleConfigChange"
            >
              <a-select-option v-for="m in measureOptions" :key="m.value" :value="m.value">
                {{ m.label }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="config-item">
            <label>聚合方式：</label>
            <a-select
              v-model:value="config.aggregation"
              style="width: 100%"
              @change="handleConfigChange"
            >
              <a-select-option value="sum">求和</a-select-option>
              <a-select-option value="avg">平均值</a-select-option>
              <a-select-option value="count">计数</a-select-option>
              <a-select-option value="max">最大值</a-select-option>
              <a-select-option value="min">最小值</a-select-option>
            </a-select>
          </div>
        </a-col>
      </a-row>

      <a-divider />

      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :md="8">
          <div class="config-item">
            <label>时间范围：</label>
            <a-range-picker
              v-model:value="config.dateRange"
              style="width: 100%"
              @change="handleConfigChange"
            />
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8">
          <div class="config-item">
            <label>班级筛选：</label>
            <a-select
              v-model:value="config.classFilter"
              mode="multiple"
              placeholder="全部班级"
              style="width: 100%"
              allowClear
              @change="handleConfigChange"
            >
              <a-select-option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
                {{ cls.label }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8">
          <div class="config-item">
            <label>费用类型：</label>
            <a-select
              v-model:value="config.feeType"
              mode="multiple"
              placeholder="全部类型"
              style="width: 100%"
              allowClear
              @change="handleConfigChange"
            >
              <a-select-option v-for="fee in feeTypeOptions" :key="fee.value" :value="fee.value">
                {{ fee.label }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <!-- 透视表展示 -->
    <a-card title="数据透视结果" :bordered="false" class="pivot-result">
      <template #extra>
        <a-radio-group v-model:value="viewMode" button-style="solid" size="small">
          <a-radio-button value="table">表格视图</a-radio-button>
          <a-radio-button value="chart">图表视图</a-radio-button>
        </a-radio-group>
      </template>

      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'">
        <a-table
          :columns="pivotColumns"
          :data-source="pivotData"
          :pagination="false"
          :scroll="{ x: 'max-content' }"
          bordered
          size="middle"
        >
          <template #bodyCell="{ column, record, text }">
            <template v-if="column.key !== 'rowHeader'">
              <span :class="getCellClass(text)">
                {{ formatCellValue(text) }}
              </span>
            </template>
            <template v-else>
              <strong>{{ text }}</strong>
            </template>
          </template>
          <template #summary>
            <a-table-summary fixed>
              <a-table-summary-row>
                <a-table-summary-cell :index="0">
                  <strong>合计</strong>
                </a-table-summary-cell>
                <a-table-summary-cell
                  v-for="(col, index) in pivotColumns.slice(1)"
                  :key="col.key"
                  :index="index + 1"
                >
                  <strong class="summary-value">{{ getColumnTotal(col.key as string) }}</strong>
                </a-table-summary-cell>
              </a-table-summary-row>
            </a-table-summary>
          </template>
        </a-table>
      </div>

      <!-- 图表视图 -->
      <div v-else>
        <div ref="pivotChartRef" class="chart-container"></div>
      </div>
    </a-card>

    <!-- 明细数据 -->
    <a-card title="明细数据" :bordered="false" class="detail-section">
      <a-table
        :columns="detailColumns"
        :data-source="detailData"
        :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }"
        size="small"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'">
            <span style="color: #52c41a">¥{{ record.amount.toLocaleString() }}</span>
          </template>
          <template v-if="column.key === 'feeType'">
            {{ getFeeTypeLabel(record.feeType) }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import type { Dayjs } from 'dayjs'

interface PivotConfig {
  rowDimension: string
  colDimension: string
  measure: string
  aggregation: string
  dateRange: [Dayjs, Dayjs] | null
  classFilter: string[]
  feeType: string[]
}

interface LabelValue {
  label: string
  value: string
}

// 配置
const config = reactive<PivotConfig>({
  rowDimension: 'class',
  colDimension: 'month',
  measure: 'amount',
  aggregation: 'sum',
  dateRange: null,
  classFilter: [],
  feeType: []
})

const viewMode = ref<'table' | 'chart'>('table')
const pivotChartRef = ref<HTMLElement | null>(null)
let pivotChart: echarts.ECharts | null = null

// 维度选项
const dimensionOptions: LabelValue[] = [
  { value: 'class', label: '班级' },
  { value: 'teacher', label: '教师' },
  { value: 'month', label: '月份' },
  { value: 'feeType', label: '费用类型' },
  { value: 'paymentMethod', label: '支付方式' }
]

// 度量选项
const measureOptions: LabelValue[] = [
  { value: 'amount', label: '金额' },
  { value: 'count', label: '笔数' },
  { value: 'students', label: '学生数' }
]

// 月份映射
const monthOptions: LabelValue[] = [
  { value: 'oct', label: '10月' },
  { value: 'nov', label: '11月' },
  { value: 'dec', label: '12月' },
  { value: 'jan', label: '1月' }
]

// 班级选项
const classOptions: LabelValue[] = [
  { value: 'class_a', label: '高三数学冲刺班A' },
  { value: 'class_b', label: '初二英语提高班' },
  { value: 'class_c', label: '小学奥数基础班' },
  { value: 'class_d', label: '高一物理VIP班' },
  { value: 'class_e', label: '高二化学提高班' }
]

// 费用类型选项
const feeTypeOptions: LabelValue[] = [
  { value: 'tuition', label: '学费' },
  { value: 'textbook', label: '教材费' },
  { value: 'material', label: '资料费' },
  { value: 'training', label: '培训费' }
]

// 获取费用类型标签
const getFeeTypeLabel = (value: string): string => {
  const found = feeTypeOptions.find(item => item.value === value)
  return found ? found.label : value
}

// 获取月份标签
const getMonthLabel = (value: string): string => {
  const found = monthOptions.find(item => item.value === value)
  return found ? found.label : value
}

// 获取班级标签
const getClassLabel = (value: string): string => {
  const found = classOptions.find(item => item.value === value)
  return found ? found.label : value
}

// 透视表列
const pivotColumns = computed(() => {
  const cols: any[] = [
    {
      title: config.rowDimension === 'class' ? '班级' : config.rowDimension === 'teacher' ? '教师' : '项目',
      dataIndex: 'rowHeader',
      key: 'rowHeader',
      fixed: 'left' as const,
      width: 150
    }
  ]

  // 根据列维度生成列
  if (config.colDimension === 'month') {
    monthOptions.forEach(m => {
      cols.push({
        title: m.label,
        dataIndex: m.value,
        key: m.value,
        width: 100,
        fixed: undefined as any
      })
    })
  } else if (config.colDimension === 'feeType') {
    feeTypeOptions.forEach(f => {
      cols.push({
        title: f.label,
        dataIndex: f.value,
        key: f.value,
        width: 100,
        fixed: undefined as any
      })
    })
  }

  cols.push({
    title: '合计',
    dataIndex: 'total',
    key: 'total',
    width: 120,
    fixed: 'right' as const
  })

  return cols
})

// Mock 透视表数据 - 使用英文键
const pivotData = computed(() => {
  if (config.colDimension === 'month') {
    return [
      { rowHeader: '高三数学冲刺班A', oct: 128000, nov: 135000, dec: 142000, jan: 156000, total: 561000 },
      { rowHeader: '初二英语提高班', oct: 86000, nov: 92000, dec: 88000, jan: 95000, total: 361000 },
      { rowHeader: '小学奥数基础班', oct: 68000, nov: 72000, dec: 75000, jan: 78000, total: 293000 },
      { rowHeader: '高一物理VIP班', oct: 180000, nov: 198000, dec: 185000, jan: 210000, total: 773000 },
      { rowHeader: '高二化学提高班', oct: 95000, nov: 102000, dec: 98000, jan: 108000, total: 403000 }
    ]
  } else {
    return [
      { rowHeader: '高三数学冲刺班A', tuition: 480000, textbook: 25000, material: 18000, training: 38000, total: 561000 },
      { rowHeader: '初二英语提高班', tuition: 320000, textbook: 15000, material: 12000, training: 14000, total: 361000 },
      { rowHeader: '小学奥数基础班', tuition: 260000, textbook: 12000, material: 8000, training: 13000, total: 293000 },
      { rowHeader: '高一物理VIP班', tuition: 680000, textbook: 35000, material: 28000, training: 30000, total: 773000 },
      { rowHeader: '高二化学提高班', tuition: 350000, textbook: 20000, material: 15000, training: 18000, total: 403000 }
    ]
  }
})

// 明细表列
const detailColumns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
  { title: '班级', dataIndex: 'className', key: 'className', width: 150 },
  { title: '教师', dataIndex: 'teacher', key: 'teacher', width: 100 },
  { title: '学生', dataIndex: 'student', key: 'student', width: 100 },
  { title: '费用类型', dataIndex: 'feeType', key: 'feeType', width: 100 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 120 },
  { title: '支付方式', dataIndex: 'paymentMethod', key: 'paymentMethod', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark' }
]

// Mock 明细数据 - 使用英文键
const detailData = ref([
  { date: '2024-01-15', className: '高三数学冲刺班A', teacher: '张老师', student: '张三', feeType: 'tuition', amount: 12800, paymentMethod: '微信支付', remark: '' },
  { date: '2024-01-15', className: '高三数学冲刺班A', teacher: '张老师', student: '李四', feeType: 'tuition', amount: 12800, paymentMethod: '支付宝', remark: '' },
  { date: '2024-01-14', className: '初二英语提高班', teacher: '李老师', student: '王五', feeType: 'textbook', amount: 580, paymentMethod: '现金', remark: '' },
  { date: '2024-01-14', className: '小学奥数基础班', teacher: '王老师', student: '赵六', feeType: 'tuition', amount: 6800, paymentMethod: '银行转账', remark: '' },
  { date: '2024-01-13', className: '高一物理VIP班', teacher: '赵老师', student: '孙七', feeType: 'training', amount: 3500, paymentMethod: '微信支付', remark: '' },
  { date: '2024-01-13', className: '高二化学提高班', teacher: '李老师', student: '周八', feeType: 'material', amount: 280, paymentMethod: '支付宝', remark: '' },
  { date: '2024-01-12', className: '高三数学冲刺班A', teacher: '张老师', student: '吴九', feeType: 'tuition', amount: 12800, paymentMethod: '微信支付', remark: '' },
  { date: '2024-01-12', className: '初二英语提高班', teacher: '李老师', student: '郑十', feeType: 'tuition', amount: 8600, paymentMethod: '银行转账', remark: '' }
])

// 计算列合计
const getColumnTotal = (key: string): string => {
  if (key === 'rowHeader') return ''
  const total = pivotData.value.reduce((sum, row: any) => sum + (row[key] || 0), 0)
  return '¥' + total.toLocaleString()
}

// 格式化单元格值
const formatCellValue = (value: any): string => {
  if (typeof value === 'number') {
    return '¥' + value.toLocaleString()
  }
  return value
}

// 获取单元格样式
const getCellClass = (value: any): string => {
  if (typeof value === 'number') {
    if (value >= 200000) return 'cell-high'
    if (value >= 100000) return 'cell-medium'
    return 'cell-low'
  }
  return ''
}

// 初始化图表
const initPivotChart = () => {
  if (!pivotChartRef.value) return

  pivotChart = echarts.init(pivotChartRef.value)
  updateChart()
}

// 更新图表
const updateChart = () => {
  if (!pivotChart) return

  const categories = pivotData.value.map((row: any) => row.rowHeader)
  const series: any[] = []

  if (config.colDimension === 'month') {
    monthOptions.forEach(month => {
      series.push({
        name: month.label,
        type: 'bar',
        data: pivotData.value.map((row: any) => row[month.value])
      })
    })
  } else {
    feeTypeOptions.forEach(feeType => {
      series.push({
        name: feeType.label,
        type: 'bar',
        stack: 'total',
        data: pivotData.value.map((row: any) => row[feeType.value] || 0)
      })
    })
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((p: any) => {
          result += `${p.marker} ${p.seriesName}: ¥${p.value.toLocaleString()}<br/>`
        })
        return result
      }
    },
    legend: {
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: 30,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => (value / 10000) + '万'
      }
    },
    series
  }

  pivotChart.setOption(option, true)
}

// 配置变化处理
const handleConfigChange = () => {
  message.info('配置已更新，重新计算中...')
  if (viewMode.value === 'chart') {
    updateChart()
  }
}

// 刷新
const handleRefresh = () => {
  message.success('数据已刷新')
}

// 导出
const handleExport = () => {
  message.success('正在导出数据...')
}

// 监听视图模式变化
watch(viewMode, (newVal) => {
  if (newVal === 'chart') {
    setTimeout(() => {
      initPivotChart()
    }, 100)
  }
})

// 窗口 resize 处理
const handleResize = () => {
  pivotChart?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pivotChart?.dispose()
})
</script>

<style scoped lang="less">
.pivot-table {
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

.config-card {
  margin-bottom: 16px;

  .config-item {
    label {
      display: block;
      margin-bottom: 8px;
      color: #666;
      font-size: 13px;
    }
  }
}

.pivot-result {
  margin-bottom: 16px;

  .chart-container {
    height: 400px;
  }

  :deep(.cell-high) {
    color: #52c41a;
    font-weight: 600;
  }

  :deep(.cell-medium) {
    color: #1890ff;
    font-weight: 500;
  }

  :deep(.cell-low) {
    color: #666;
  }

  :deep(.summary-value) {
    color: #722ed1;
  }
}

.detail-section {
  margin-bottom: 16px;
}
</style>