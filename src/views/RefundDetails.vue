<template>
  <div class="refund-details">
    <div class="page-header">
      <h2>退费明细</h2>
      <a-space>
        <a-range-picker
          v-model:value="dateRange"
          :placeholder="['开始日期', '结束日期']"
          style="width: 260px"
        />
        <a-button type="primary" @click="showAddModal">
          <template #icon><PlusOutlined /></template>
          申请退费
        </a-button>
      </a-space>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" class="stats-section">
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="本月退费总额" prefix="¥" :value="statistics.monthTotal" :precision="2" :value-style="{ color: '#ff4d4f' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="退费笔数" :value="statistics.count" suffix="笔" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="待审核" :value="statistics.pending" suffix="笔" :value-style="{ color: '#faad14' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="退费率" :value="statistics.rate" suffix="%" :precision="1" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 退费原因分布图 -->
    <a-row :gutter="[16, 16]" class="chart-section">
      <a-col :xs="24" :lg="12">
        <a-card title="退费原因分布" :bordered="false">
          <div ref="pieChartRef" class="chart-container"></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="月度退费趋势" :bordered="false">
          <div ref="lineChartRef" class="chart-container"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 退费记录表格 -->
    <a-card title="退费记录" :bordered="false">
      <template #extra>
        <a-space>
          <a-select
            v-model:value="statusFilter"
            placeholder="审核状态"
            style="width: 120px"
            allowClear
          >
            <a-select-option value="pending">待审核</a-select-option>
            <a-select-option value="approved">已批准</a-select-option>
            <a-select-option value="rejected">已拒绝</a-select-option>
            <a-select-option value="completed">已完成</a-select-option>
          </a-select>
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索学生姓名"
            style="width: 180px"
          />
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="filteredData"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'studentName'">
            <a-space>
              <a-avatar size="small" :style="{ backgroundColor: '#ff4d4f' }">
                {{ record.studentName.charAt(0) }}
              </a-avatar>
              {{ record.studentName }}
            </a-space>
          </template>
          <template v-if="column.key === 'originalAmount'">
            <span>¥{{ record.originalAmount.toLocaleString() }}</span>
          </template>
          <template v-if="column.key === 'refundAmount'">
            <span style="color: #ff4d4f; font-weight: 500">¥{{ record.refundAmount.toLocaleString() }}</span>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
              <a-button
                v-if="record.status === 'pending'"
                type="link"
                size="small"
                @click="approveRefund(record)"
              >
                审核
              </a-button>
              <a-button
                v-if="record.status === 'approved'"
                type="link"
                size="small"
                @click="processRefund(record)"
              >
                处理退款
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 申请退费弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      title="申请退费"
      width="600px"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        :model="refundForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="学生姓名" required>
          <a-select
            v-model:value="refundForm.studentId"
            placeholder="请选择学生"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option v-for="s in studentOptions" :key="s.id" :value="s.id">
              {{ s.name }} ({{ s.class }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="退费类型" required>
          <a-select v-model:value="refundForm.type" placeholder="请选择退费类型">
            <a-select-option value="full">全额退费</a-select-option>
            <a-select-option value="partial">部分退费</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="原缴费金额">
          <a-input-number
            v-model:value="refundForm.originalAmount"
            :min="0"
            :precision="2"
            prefix="¥"
            style="width: 100%"
            disabled
          />
        </a-form-item>
        <a-form-item label="申请退费金额" required>
          <a-input-number
            v-model:value="refundForm.refundAmount"
            :min="0"
            :max="refundForm.originalAmount"
            :precision="2"
            prefix="¥"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="退费原因" required>
          <a-select v-model:value="refundForm.reason" placeholder="请选择退费原因">
            <a-select-option value="personal">个人原因</a-select-option>
            <a-select-option value="schedule">时间冲突</a-select-option>
            <a-select-option value="quality">教学质量</a-select-option>
            <a-select-option value="transfer">转班</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="详细说明">
          <a-textarea
            v-model:value="refundForm.description"
            :rows="3"
            placeholder="请输入详细说明"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import type { Dayjs } from 'dayjs'

interface RefundRecord {
  id: string
  studentName: string
  studentId: string
  className: string
  originalAmount: number
  refundAmount: number
  reason: string
  status: string
  applyTime: string
  approveTime: string
  completeTime: string
  operator: string
  remark: string
}

// 日期范围和筛选
const dateRange = ref<[Dayjs, Dayjs] | null>(null)
const statusFilter = ref<string | undefined>(undefined)
const searchText = ref('')
const loading = ref(false)

// 统计数据
const statistics = reactive({
  monthTotal: 45680,
  count: 12,
  pending: 3,
  rate: 2.8
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 12
})

// 图表 refs
const pieChartRef = ref<HTMLElement | null>(null)
const lineChartRef = ref<HTMLElement | null>(null)
let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

// 表格列
// 表格列
const columns = [
  { title: '退费单号', dataIndex: 'id', key: 'id', width: 140 },
  { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 120 },
  { title: '班级', dataIndex: 'className', key: 'className', width: 150 },
  { title: '原缴费金额', dataIndex: 'originalAmount', key: 'originalAmount', width: 120 },
  { title: '退费金额', dataIndex: 'refundAmount', key: 'refundAmount', width: 120 },
  { title: '退费原因', dataIndex: 'reason', key: 'reason', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '申请时间', dataIndex: 'applyTime', key: 'applyTime', width: 160 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' as const }
]

// Mock 退费数据
const refundData = ref<RefundRecord[]>([
  { id: 'REF20240115001', studentName: '张小明', studentId: 'S001', className: '高三数学冲刺班A', originalAmount: 12800, refundAmount: 8500, reason: '个人原因', status: 'completed', applyTime: '2024-01-15 10:30:00', approveTime: '2024-01-15 14:00:00', completeTime: '2024-01-16 10:00:00', operator: '财务李', remark: '已完成退款' },
  { id: 'REF20240114001', studentName: '李小红', studentId: 'S002', className: '初二英语提高班', originalAmount: 8600, refundAmount: 8600, reason: '时间冲突', status: 'approved', applyTime: '2024-01-14 09:20:00', approveTime: '2024-01-14 15:30:00', completeTime: '', operator: '财务王', remark: '待退款' },
  { id: 'REF20240113001', studentName: '王小刚', studentId: 'S003', className: '小学奥数基础班', originalAmount: 6800, refundAmount: 5000, reason: '教学质量', status: 'pending', applyTime: '2024-01-13 16:45:00', approveTime: '', completeTime: '', operator: '', remark: '待审核' },
  { id: 'REF20240112001', studentName: '赵小美', studentId: 'S004', className: '高一物理VIP班', originalAmount: 18000, refundAmount: 12000, reason: '转班', status: 'pending', applyTime: '2024-01-12 11:00:00', approveTime: '', completeTime: '', operator: '', remark: '待审核' },
  { id: 'REF20240111001', studentName: '孙小强', studentId: 'S005', className: '高三数学冲刺班A', originalAmount: 12800, refundAmount: 6400, reason: '个人原因', status: 'rejected', applyTime: '2024-01-11 14:30:00', approveTime: '2024-01-11 17:00:00', completeTime: '', operator: '财务李', remark: '不符合退费条件' },
  { id: 'REF20240110001', studentName: '周小燕', studentId: 'S006', className: '初二英语提高班', originalAmount: 8600, refundAmount: 4300, reason: '其他', status: 'completed', applyTime: '2024-01-10 09:00:00', approveTime: '2024-01-10 11:00:00', completeTime: '2024-01-11 09:00:00', operator: '财务王', remark: '已完成退款' },
  { id: 'REF20240109001', studentName: '吴小龙', studentId: 'S007', className: '小学奥数基础班', originalAmount: 6800, refundAmount: 6800, reason: '时间冲突', status: 'pending', applyTime: '2024-01-09 15:20:00', approveTime: '', completeTime: '', operator: '', remark: '待审核' }
])

// 筛选后的数据
const filteredData = computed(() => {
  return refundData.value.filter(item => {
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
    const matchSearch = !searchText.value || item.studentName.includes(searchText.value)
    return matchStatus && matchSearch
  })
})

// 弹窗相关
const modalVisible = ref(false)
const refundForm = reactive({
  studentId: undefined as string | undefined,
  type: 'partial',
  originalAmount: 12800,
  refundAmount: 0,
  reason: undefined as string | undefined,
  description: ''
})

// 学生选项
const studentOptions = [
  { id: 'S001', name: '张小明', class: '高三数学冲刺班A' },
  { id: 'S002', name: '李小红', class: '初二英语提高班' },
  { id: 'S003', name: '王小刚', class: '小学奥数基础班' },
  { id: 'S004', name: '赵小美', class: '高一物理VIP班' }
]

// 状态相关
const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    pending: 'orange',
    approved: 'blue',
    rejected: 'red',
    completed: 'green'
  }
  return map[status] || 'default'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
    completed: '已完成'
  }
  return map[status] || status
}

// 筛选选项
const filterOption = (input: string, option: any) => {
  return option.children[0].children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChartRef.value) return

  pieChart = echarts.init(pieChartRef.value)
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}笔 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '退费原因',
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
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: 5, name: '个人原因', itemStyle: { color: '#1890ff' } },
          { value: 3, name: '时间冲突', itemStyle: { color: '#52c41a' } },
          { value: 2, name: '教学质量', itemStyle: { color: '#ff4d4f' } },
          { value: 1, name: '转班', itemStyle: { color: '#722ed1' } },
          { value: 1, name: '其他', itemStyle: { color: '#faad14' } }
        ]
      }
    ]
  }
  pieChart.setOption(option)
}

// 初始化折线图
const initLineChart = () => {
  if (!lineChartRef.value) return

  lineChart = echarts.init(lineChartRef.value)
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['退费金额', '退费笔数']
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
      data: ['8月', '9月', '10月', '11月', '12月', '1月']
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        position: 'left',
        axisLabel: {
          formatter: (value: number) => (value / 1000) + 'k'
        }
      },
      {
        type: 'value',
        name: '笔数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '退费金额',
        type: 'line',
        smooth: true,
        data: [28000, 35000, 42000, 38000, 52000, 45680],
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { color: 'rgba(255, 77, 79, 0.1)' }
      },
      {
        name: '退费笔数',
        type: 'bar',
        yAxisIndex: 1,
        data: [8, 10, 12, 9, 15, 12],
        itemStyle: { color: '#1890ff' }
      }
    ]
  }
  lineChart.setOption(option)
}

// 事件处理
const showAddModal = () => {
  Object.assign(refundForm, {
    studentId: undefined,
    type: 'partial',
    originalAmount: 12800,
    refundAmount: 0,
    reason: undefined,
    description: ''
  })
  modalVisible.value = true
}

const handleModalOk = () => {
  if (!refundForm.studentId || !refundForm.reason || refundForm.refundAmount <= 0) {
    message.error('请填写完整信息')
    return
  }
  message.success('退费申请已提交')
  modalVisible.value = false
}

const handleModalCancel = () => {
  modalVisible.value = false
}

const viewDetail = (record: RefundRecord) => {
  message.info(`查看退费详情: ${record.id}`)
}

const approveRefund = (record: RefundRecord) => {
  message.info(`审核退费申请: ${record.id}`)
}

const processRefund = (record: RefundRecord) => {
  message.success(`处理退款: ${record.id}`)
}

// 窗口 resize 处理
const handleResize = () => {
  pieChart?.resize()
  lineChart?.resize()
}

onMounted(() => {
  initPieChart()
  initLineChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  lineChart?.dispose()
})
</script>

<style scoped lang="less">
.refund-details {
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

.stats-section {
  margin-bottom: 16px;
}

.chart-section {
  margin-bottom: 16px;

  .chart-container {
    height: 280px;
  }
}
</style>