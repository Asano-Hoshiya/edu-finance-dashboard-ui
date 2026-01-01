<!-- src/components/PieChart.vue -->
<template>
  <div class="pie-chart-container">
    <div v-if="title" class="chart-title">{{ title }}</div>
    <div ref="chartRef" class="chart-wrapper" :style="{ height: height }"></div>
    <div v-if="loading" class="chart-loading">
      <a-spin size="large" />
    </div>
    <div v-if="!loading && isEmpty" class="chart-empty">
      <a-empty description="暂无数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption, ECharts } from 'echarts'

// 类型定义
export interface PieChartDataItem {
  name: string
  value: number
  itemStyle?: {
    color?: string
  }
}

export interface PieChartData {
  items: PieChartDataItem[]
}

export interface PieChartConfig {
  showLegend?: boolean
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  legendOrient?: 'horizontal' | 'vertical'
  showTooltip?: boolean
  showLabel?: boolean
  labelPosition?: 'inside' | 'outside'
  labelFormat?: 'name' | 'value' | 'percent' | 'nameValue' | 'namePercent'
  radius?: string | number | [string | number, string | number]
  center?: [string | number, string | number]
  roseType?: false | 'radius' | 'area'
  selectedMode?: boolean | 'single' | 'multiple'
  colors?: string[]
  animation?: boolean
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
}

// Props 定义
interface Props {
  title?: string
  data: PieChartData
  config?: PieChartConfig
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: '300px',
  loading: false,
  config: () => ({})
})

// Emits 定义
const emit = defineEmits<{
  (e: 'click', params: Record<string, unknown>): void
  (e: 'legendChange', params: { name: string; selected: Record<string, boolean> }): void
}>()

// Refs
const chartRef = ref<HTMLDivElement>()
let chartInstance: ECharts | null = null

// 计算属性
const isEmpty = computed(() => {
  return !props.data?.items?.length || props.data.items.every(item => !item.value)
})

// 计算总值
const totalValue = computed(() => {
  return props.data?.items?.reduce((sum, item) => sum + (item.value || 0), 0) || 0
})

// 默认颜色
const defaultColors = [
  '#5B8FF9',
  '#5AD8A6',
  '#F6BD16',
  '#E86452',
  '#6DC8EC',
  '#945FB9',
  '#FF9845',
  '#1E9493',
  '#FF99C3'
]

// 格式化标签
const formatLabel = (params: { name: string; value: number; percent: number }): string => {
  const { name, value, percent } = params
  const format = props.config.labelFormat || 'namePercent'

  switch (format) {
    case 'name':
      return name
    case 'value':
      return value.toLocaleString()
    case 'percent':
      return `${percent.toFixed(1)}%`
    case 'nameValue':
      return `${name}: ${value.toLocaleString()}`
    case 'namePercent':
    default:
      return `${name}\n${percent.toFixed(1)}%`
  }
}

// 生成图表配置
const generateOption = (): EChartsOption => {
  const { config, data } = props

  // 计算图例位置对应的 center 偏移
  let chartCenter = config.center || ['50%', '50%']
  if (config.showLegend !== false) {
    switch (config.legendPosition) {
      case 'right':
        chartCenter = ['40%', '50%']
        break
      case 'left':
        chartCenter = ['60%', '50%']
        break
      case 'bottom':
        chartCenter = ['50%', '45%']
        break
      case 'top':
      default:
        chartCenter = ['50%', '55%']
        break
    }
  }

  const option: EChartsOption = {
    color: config.colors || defaultColors,
    tooltip: config.showTooltip !== false ? {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: (params: unknown) => {
        const { name, value, percent } = params as { name: string; value: number; percent: number }
        return `
          <div style="padding: 4px 0;">
            <div style="font-weight: 500; margin-bottom: 4px;">${name}</div>
            <div>数值：<span style="font-weight: 600; color: #333;">${(value as number).toLocaleString()}</span></div>
            <div>占比：<span style="font-weight: 600; color: #333;">${(percent as number).toFixed(1)}%</span></div>
          </div>
        `
      }
    } : undefined,
    legend: config.showLegend !== false ? {
      show: true,
      type: 'scroll',
      orient: config.legendOrient ||
        (config.legendPosition === 'left' || config.legendPosition === 'right'
          ? 'vertical'
          : 'horizontal'),
      left: config.legendPosition === 'right' ? 'right' :
            config.legendPosition === 'left' ? 'left' : 'center',
      top: config.legendPosition === 'bottom' ? 'bottom' :
           config.legendPosition === 'top' ? 'top' : 'middle',
      itemWidth: 10,
      itemHeight: 10,
      icon: 'circle',
      textStyle: {
        fontSize: 12,
        color: '#666'
      },
      formatter: (name: string) => {
        const item = data.items?.find(i => i.name === name)
        if (item && totalValue.value > 0) {
          const percent = ((item.value / totalValue.value) * 100).toFixed(1)
          return `${name}  ${percent}%`
        }
        return name
      }
    } : undefined,
    series: [
      {
        name: props.title || '数据分布',
        type: 'pie',
        radius: config.radius || ['45%', '70%'],
        center: chartCenter,
        roseType: config.roseType || false,
        selectedMode: config.selectedMode ?? 'single',
        itemStyle: {
          borderRadius: config.borderRadius ?? 4,
          borderWidth: config.borderWidth ?? 2,
          borderColor: config.borderColor ?? '#fff'
        },
        label: {
          show: config.showLabel ?? true,
          position: config.labelPosition || 'outside',
          formatter: (params: unknown) => formatLabel(params as { name: string; value: number; percent: number }),
          fontSize: 11,
          color: '#666',
          lineHeight: 16
        },
        labelLine: {
          show: config.showLabel ?? true,
          length: 10,
          length2: 15,
          smooth: true
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: (data.items || []).map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: item.itemStyle
        })),
        animationType: 'scale',
        animationEasing: 'elasticOut'
      }
    ],
    animation: config.animation !== false,
    animationDuration: 1000
  }

  return option
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  // 销毁已有实例
  if (chartInstance) {
    chartInstance.dispose()
  }

  // 创建新实例
  chartInstance = echarts.init(chartRef.value)

  // 设置配置
  const option = generateOption()
  chartInstance.setOption(option)

  // 绑定事件
  chartInstance.on('click', (params) => {
    emit('click', params as Record<string, unknown>)
  })

  chartInstance.on('legendselectchanged', (params) => {
    const { name, selected } = params as { name: string; selected: Record<string, boolean> }
    emit('legendChange', { name, selected })
  })
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) {
    initChart()
    return
  }

  const option = generateOption()
  chartInstance.setOption(option, { notMerge: true })
}

// 响应式处理
const handleResize = () => {
  chartInstance?.resize()
}

// 监听数据变化
watch(
  () => [props.data, props.config],
  () => {
    nextTick(() => {
      updateChart()
    })
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})

// 暴露方法
defineExpose({
  resize: handleResize,
  getInstance: () => chartInstance
})
</script>

<style scoped lang="less">
.pie-chart-container {
  position: relative;
  width: 100%;
  background: #fff;
  border-radius: 4px;

  .chart-title {
    padding: 12px 16px 0;
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  .chart-wrapper {
    width: 100%;
    min-height: 200px;
  }

  .chart-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.8);
    z-index: 10;
  }

  .chart-empty {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>