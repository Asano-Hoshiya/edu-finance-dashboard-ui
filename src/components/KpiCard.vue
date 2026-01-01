<template>
  <a-card class="kpi-card" :bordered="bordered" :hoverable="hoverable">
    <div class="kpi-content">
      <!-- 标题区域 -->
      <div class="kpi-header">
        <span class="kpi-title">{{ title }}</span>
        <a-tooltip v-if="tooltip" :title="tooltip">
          <info-circle-outlined class="kpi-info-icon" />
        </a-tooltip>
      </div>

      <!-- 数值区域 -->
      <div class="kpi-value-wrapper">
        <span v-if="prefix" class="kpi-prefix">{{ prefix }}</span>
        <span class="kpi-value" :style="{ color: valueColor }">
          {{ formattedValue }}
        </span>
        <span v-if="suffix" class="kpi-suffix">{{ suffix }}</span>
      </div>

      <!-- 趋势区域 -->
      <div v-if="showTrend && trendValue !== undefined" class="kpi-trend">
        <span :class="['trend-indicator', trendClass]">
          <arrow-up-outlined v-if="trendDirection === 'up'" />
          <arrow-down-outlined v-if="trendDirection === 'down'" />
          <minus-outlined v-if="trendDirection === 'flat'" />
          <span class="trend-value">{{ formattedTrendValue }}</span>
        </span>
        <span v-if="trendLabel" class="trend-label">{{ trendLabel }}</span>
      </div>

      <!-- 描述区域 -->
      <div v-if="description" class="kpi-description">
        {{ description }}
      </div>
    </div>

    <!-- 图标插槽 -->
    <div v-if="$slots.icon" class="kpi-icon-wrapper">
      <slot name="icon"></slot>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card as ACard, Tooltip as ATooltip } from 'ant-design-vue';
import {
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons-vue';

/**
 * KpiCard 组件属性接口
 */
interface KpiCardProps {
  /** 卡片标题 */
  title: string;
  /** 显示的值（数字或字符串） */
  value: number | string;
  /** 数值前缀（如货币符号 ¥、$） */
  prefix?: string;
  /** 数值后缀（如单位 元、%、人、次） */
  suffix?: string;
  /** 小数精度，默认 2 */
  precision?: number;
  /** 是否使用千分位分隔符，默认 true */
  useGrouping?: boolean;
  /** 提示信息（鼠标悬浮显示） */
  tooltip?: string;
  /** 卡片描述文本 */
  description?: string;
  /** 趋势变化值（百分比） */
  trendValue?: number;
  /** 趋势标签（如"较上月"、"同比"） */
  trendLabel?: string;
  /** 是否显示趋势，默认 true */
  showTrend?: boolean;
  /** 趋势上升是否为正向（用于颜色判断），默认 true */
  trendUpIsGood?: boolean;
  /** 自定义数值颜色 */
  valueColor?: string;
  /** 是否显示边框，默认 true */
  bordered?: boolean;
  /** 是否可悬浮，默认 false */
  hoverable?: boolean;
}

const props = withDefaults(defineProps<KpiCardProps>(), {
  prefix: '',
  suffix: '',
  precision: 2,
  useGrouping: true,
  tooltip: '',
  description: '',
  trendValue: undefined,
  trendLabel: '',
  showTrend: true,
  trendUpIsGood: true,
  valueColor: '',
  bordered: true,
  hoverable: false,
});

/**
 * 格式化主数值
 * 支持数字格式化（千分位、精度）和字符串直接显示
 */
const formattedValue = computed<string>(() => {
  // 字符串类型直接返回
  if (typeof props.value === 'string') {
    return props.value;
  }

  // 非有效数字返回占位符
  if (typeof props.value !== 'number' || isNaN(props.value)) {
    return '--';
  }

  // 使用 Intl.NumberFormat 进行数字格式化
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: props.precision,
    maximumFractionDigits: props.precision,
    useGrouping: props.useGrouping,
  };

  return new Intl.NumberFormat('zh-CN', formatOptions).format(props.value);
});

/**
 * 计算趋势方向
 */
const trendDirection = computed<'up' | 'down' | 'flat'>(() => {
  if (props.trendValue === undefined || props.trendValue === 0) {
    return 'flat';
  }
  return props.trendValue > 0 ? 'up' : 'down';
});

/**
 * 趋势样式类名
 * 根据趋势方向和正向判断决定使用哪种颜色
 */
const trendClass = computed<string>(() => {
  if (trendDirection.value === 'flat') {
    return 'flat';
  }

  const isPositive = trendDirection.value === 'up';
  const isGood = props.trendUpIsGood ? isPositive : !isPositive;

  return isGood ? 'good' : 'bad';
});

/**
 * 格式化趋势值
 */
const formattedTrendValue = computed<string>(() => {
  if (props.trendValue === undefined) {
    return '';
  }
  const absValue = Math.abs(props.trendValue);
  return `${absValue.toFixed(props.precision)}%`;
});
</script>

<style scoped lang="less">
// 颜色变量
@primary-color: #1890ff;
@success-color: #52c41a;
@error-color: #ff4d4f;
@text-color: rgba(0, 0, 0, 0.85);
@text-color-secondary: rgba(0, 0, 0, 0.45);

.kpi-card {
  position: relative;
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;

  :deep(.ant-card-body) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    min-height: 120px;
  }

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.kpi-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kpi-title {
  font-size: 14px;
  color: @text-color-secondary;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-info-icon {
  font-size: 14px;
  color: @text-color-secondary;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: @primary-color;
  }
}

.kpi-value-wrapper {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
}

.kpi-prefix {
  font-size: 20px;
  color: @text-color;
  font-weight: 500;
}

.kpi-value {
  font-size: 30px;
  font-weight: 600;
  color: @text-color;
  line-height: 1.2;
  word-break: break-all;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}

.kpi-suffix {
  font-size: 14px;
  color: @text-color-secondary;
  margin-left: 4px;
  font-weight: 400;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.good {
    color: @success-color;
  }

  &.bad {
    color: @error-color;
  }

  &.flat {
    color: @text-color-secondary;
  }
}

.trend-value {
  font-weight: 500;
}

.trend-label {
  color: @text-color-secondary;
  font-size: 12px;
}

.kpi-description {
  font-size: 12px;
  color: @text-color-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}

.kpi-icon-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-left: 16px;
  font-size: 32px;
  color: @primary-color;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 50%;
}

/* 响应式布局 */
@media screen and (max-width: 992px) {
  .kpi-card {
    :deep(.ant-card-body) {
      padding: 16px 20px;
      min-height: 100px;
    }
  }

  .kpi-value {
    font-size: 26px;
  }

  .kpi-icon-wrapper {
    width: 56px;
    height: 56px;
    font-size: 28px;
  }
}

@media screen and (max-width: 768px) {
  .kpi-card {
    :deep(.ant-card-body) {
      padding: 14px 16px;
      min-height: 90px;
    }
  }

  .kpi-value {
    font-size: 24px;
  }

  .kpi-icon-wrapper {
    width: 48px;
    height: 48px;
    font-size: 24px;
    margin-left: 12px;
  }
}

@media screen and (max-width: 480px) {
  .kpi-value {
    font-size: 20px;
  }

  .kpi-prefix {
    font-size: 16px;
  }

  .kpi-icon-wrapper {
    display: none;
  }
}
</style>