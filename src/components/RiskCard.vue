<template>
  <div class="risk-card-container">
    <h3 class="section-title">风险指标监控</h3>
    <div class="risk-cards">
      <div
        v-for="(risk, index) in riskList"
        :key="index"
        class="risk-card"
        :class="getRiskLevelClass(risk.level)"
      >
        <div class="risk-header">
          <span class="risk-name">{{ risk.name }}</span>
          <span class="risk-badge" :class="getRiskLevelClass(risk.level)">
            {{ getRiskLevelText(risk.level) }}
          </span>
        </div>
        <div class="risk-description">{{ risk.description }}</div>
        <div class="risk-footer">
          <span class="risk-value">当前值: {{ risk.currentValue }}</span>
          <span class="risk-threshold">阈值: {{ risk.threshold }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RiskItem {
  name: string
  level: 'low' | 'medium' | 'high'
  description: string
  currentValue: string
  threshold: string
}

// Mock 数据
const riskList: RiskItem[] = [
  {
    name: '退费率预警',
    level: 'high',
    description: '本月退费率超过预设阈值，需关注学员满意度',
    currentValue: '8.5%',
    threshold: '5%'
  },
  {
    name: '收款延迟风险',
    level: 'medium',
    description: '存在部分学员缴费延迟超过7天',
    currentValue: '12人',
    threshold: '10人'
  },
  {
    name: '教师流失风险',
    level: 'low',
    description: '教师团队稳定性良好',
    currentValue: '2%',
    threshold: '10%'
  },
  {
    name: '课程空置率',
    level: 'medium',
    description: '部分班级报名人数未达预期',
    currentValue: '25%',
    threshold: '20%'
  },
  {
    name: '现金流风险',
    level: 'low',
    description: '当前现金流状况健康',
    currentValue: '充足',
    threshold: '警戒线以上'
  },
  {
    name: '合同到期预警',
    level: 'high',
    description: '有多份教师合同即将到期需续签',
    currentValue: '5份',
    threshold: '3份'
  }
]

const getRiskLevelClass = (level: string): string => {
  return `risk-${level}`
}

const getRiskLevelText = (level: string): string => {
  const levelMap: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }
  return levelMap[level] || '未知'
}
</script>

<style scoped>
.risk-card-container {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.risk-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.risk-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background-color: #fafafa;
  transition: transform 0.2s, box-shadow 0.2s;
}

.risk-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.risk-card.risk-low {
  border-left-color: #52c41a;
  background-color: #f6ffed;
}

.risk-card.risk-medium {
  border-left-color: #faad14;
  background-color: #fffbe6;
}

.risk-card.risk-high {
  border-left-color: #ff4d4f;
  background-color: #fff2f0;
}

.risk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.risk-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.risk-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.risk-badge.risk-low {
  background-color: #52c41a;
  color: #fff;
}

.risk-badge.risk-medium {
  background-color: #faad14;
  color: #fff;
}

.risk-badge.risk-high {
  background-color: #ff4d4f;
  color: #fff;
}

.risk-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.risk-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #888;
  padding-top: 10px;
  border-top: 1px dashed #e0e0e0;
}

.risk-value {
  font-weight: 500;
}

.risk-threshold {
  color: #999;
}

@media (max-width: 768px) {
  .risk-cards {
    grid-template-columns: 1fr;
  }
}
</style>