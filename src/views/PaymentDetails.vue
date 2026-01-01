<template>
  <div class="payment-details">
    <div class="page-header">
      <h2>缴费明细</h2>
      <a-space>
        <a-range-picker
          v-model:value="dateRange"
          :placeholder="['开始日期', '结束日期']"
          style="width: 260px"
        />
        <a-button type="primary" @click="handleExport">
          <template #icon><DownloadOutlined /></template>
          导出明细
        </a-button>
      </a-space>
    </div>

    <!-- 筛选区域 -->
    <a-card class="filter-card" :bordered="false">
      <a-form layout="inline" :model="filterForm">
        <a-form-item label="班级">
          <a-select
            v-model:value="filterForm.classId"
            placeholder="请选择班级"
            style="width: 180px"
            allowClear
          >
            <a-select-option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
              {{ cls.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="缴费状态">
          <a-select
            v-model:value="filterForm.status"
            placeholder="请选择状态"
            style="width: 120px"
            allowClear
          >
            <a-select-option value="paid">已缴费</a-select-option>
            <a-select-option value="pending">待缴费</a-select-option>
            <a-select-option value="overdue">已逾期</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="缴费方式">
          <a-select
            v-model:value="filterForm.paymentMethod"
            placeholder="请选择方式"
            style="width: 120px"
            allowClear
          >
            <a-select-option value="wechat">微信支付</a-select-option>
            <a-select-option value="alipay">支付宝</a-select-option>
            <a-select-option value="bank">银行转账</a-select-option>
            <a-select-option value="cash">现金</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 统计汇总 -->
    <a-row :gutter="[16, 16]" class="stats-section">
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="总缴费金额" prefix="¥" :value="statistics.totalAmount" :precision="2" :value-style="{ color: '#52c41a' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="缴费笔数" :value="statistics.totalCount" suffix="笔" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="待缴费金额" prefix="¥" :value="statistics.pendingAmount" :precision="2" :value-style="{ color: '#faad14' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="逾期未缴" prefix="¥" :value="statistics.overdueAmount" :precision="2" :value-style="{ color: '#ff4d4f' }" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 缴费明细表格 -->
    <a-card title="缴费记录" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="paymentData"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'studentName'">
            <a-space>
              <a-avatar size="small" :style="{ backgroundColor: '#1890ff' }">
                {{ record.studentName.charAt(0) }}
              </a-avatar>
              {{ record.studentName }}
            </a-space>
          </template>
          <template v-if="column.key === 'amount'">
            <span style="color: #52c41a; font-weight: 500">¥{{ record.amount.toLocaleString() }}</span>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'paymentMethod'">
            <a-space>
              <component :is="getPaymentIcon(record.paymentMethod)" />
              {{ getPaymentMethodText(record.paymentMethod) }}
            </a-space>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
              <a-button v-if="record.status === 'paid'" type="link" size="small" @click="printReceipt(record)">
                打印收据
              </a-button>
              <a-button v-if="record.status === 'pending'" type="link" size="small" @click="sendReminder(record)">
                发送提醒
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import {
  DownloadOutlined,
  SearchOutlined,
  WechatOutlined,
  AlipayCircleOutlined,
  BankOutlined,
  DollarOutlined
} from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'

interface PaymentRecord {
  id: string
  studentName: string
  studentId: string
  className: string
  feeType: string
  amount: number
  status: string
  paymentMethod: string
  paymentTime: string
  operator: string
  remark: string
}

// 日期范围
const dateRange = ref<[Dayjs, Dayjs] | null>(null)
const loading = ref(false)

// 筛选表单
const filterForm = reactive({
  classId: undefined as string | undefined,
  status: undefined as string | undefined,
  paymentMethod: undefined as string | undefined
})

// 班级选项
const classOptions = [
  { value: '1', label: '高三数学冲刺班A' },
  { value: '2', label: '初二英语提高班' },
  { value: '3', label: '小学奥数基础班' },
  { value: '4', label: '高一物理VIP班' }
]

// 统计数据
const statistics = reactive({
  totalAmount: 528600,
  totalCount: 156,
  pendingAmount: 45800,
  overdueAmount: 12600
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 156,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 表格列
const columns = [
  { title: '缴费单号', dataIndex: 'id', key: 'id', width: 140 },
  { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 130 },
  { title: '学号', dataIndex: 'studentId', key: 'studentId', width: 100 },
  { title: '班级', dataIndex: 'className', key: 'className', width: 150 },
  { title: '费用类型', dataIndex: 'feeType', key: 'feeType', width: 100 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '支付方式', dataIndex: 'paymentMethod', key: 'paymentMethod', width: 120 },
  { title: '缴费时间', dataIndex: 'paymentTime', key: 'paymentTime', width: 160 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const }
]

// Mock 缴费数据
const paymentData = ref<PaymentRecord[]>([
  { id: 'PAY20240115001', studentName: '张三', studentId: 'S001', className: '高三数学冲刺班A', feeType: '学费', amount: 12800, status: 'paid', paymentMethod: 'wechat', paymentTime: '2024-01-15 10:30:00', operator: '系统', remark: '' },
  { id: 'PAY20240115002', studentName: '李四', studentId: 'S002', className: '高三数学冲刺班A', feeType: '学费', amount: 12800, status: 'paid', paymentMethod: 'alipay', paymentTime: '2024-01-15 11:20:00', operator: '系统', remark: '' },
  { id: 'PAY20240114001', studentName: '王五', studentId: 'S003', className: '初二英语提高班', feeType: '学费', amount: 8600, status: 'paid', paymentMethod: 'bank', paymentTime: '2024-01-14 09:45:00', operator: '财务', remark: '银行转账' },
  { id: 'PAY20240114002', studentName: '赵六', studentId: 'S004', className: '初二英语提高班', feeType: '教材费', amount: 580, status: 'pending', paymentMethod: '', paymentTime: '', operator: '', remark: '待缴费' },
  { id: 'PAY20240113001', studentName: '孙七', studentId: 'S005', className: '小学奥数基础班', feeType: '学费', amount: 6800, status: 'overdue', paymentMethod: '', paymentTime: '', operator: '', remark: '已逾期3天' },
  { id: 'PAY20240113002', studentName: '周八', studentId: 'S006', className: '高一物理VIP班', feeType: '学费', amount: 18000, status: 'paid', paymentMethod: 'cash', paymentTime: '2024-01-13 14:00:00', operator: '财务', remark: '现金收款' },
  { id: 'PAY20240112001', studentName: '吴九', studentId: 'S007', className: '高三数学冲刺班A', feeType: '资料费', amount: 280, status: 'paid', paymentMethod: 'wechat', paymentTime: '2024-01-12 16:30:00', operator: '系统', remark: '' },
  { id: 'PAY20240112002', studentName: '郑十', studentId: 'S008', className: '初二英语提高班', feeType: '学费', amount: 8600, status: 'pending', paymentMethod: '', paymentTime: '', operator: '', remark: '待缴费' }
])

// 状态相关
const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    paid: 'green',
    pending: 'orange',
    overdue: 'red'
  }
  return map[status] || 'default'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    paid: '已缴费',
    pending: '待缴费',
    overdue: '已逾期'
  }
  return map[status] || status
}

// 支付方式相关
const getPaymentMethodText = (method: string) => {
  const map: Record<string, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    bank: '银行转账',
    cash: '现金'
  }
  return map[method] || '-'
}

const getPaymentIcon = (method: string) => {
  const map: Record<string, any> = {
    wechat: WechatOutlined,
    alipay: AlipayCircleOutlined,
    bank: BankOutlined,
    cash: DollarOutlined
  }
  return map[method] || DollarOutlined
}

// 事件处理
const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    message.success('查询完成')
  }, 500)
}

const handleReset = () => {
  filterForm.classId = undefined
  filterForm.status = undefined
  filterForm.paymentMethod = undefined
  dateRange.value = null
}

const handleExport = () => {
  message.success('正在导出缴费明细...')
}

const viewDetail = (record: PaymentRecord) => {
  message.info(`查看缴费单详情: ${record.id}`)
}

const printReceipt = (record: PaymentRecord) => {
  message.success(`正在打印收据: ${record.id}`)
}

const sendReminder = (record: PaymentRecord) => {
  message.success(`已发送缴费提醒给: ${record.studentName}`)
}
</script>

<style scoped lang="less">
.payment-details {
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

.filter-card {
  margin-bottom: 16px;
}

.stats-section {
  margin-bottom: 16px;
}
</style>