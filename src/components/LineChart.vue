<!-- src/components/LineChart.vue -->
<template>
  <div class="line-chart-container">
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
export interface LineChartSeries {
  name: string
  data: number[]
  type?: 'line'
  smooth?: boolean
  areaStyle?: Record<string, unknown> | null
  lineStyle?: {
    width?: number
    type?: 'solid' | 'dashed' | 'dotted'
    color?: string
  }
  itemStyle?: {
    color?: string
  }
  stack?: string
  showSymbol?: boolean
  symbolSize?: number
}

export interface LineChartData {
  xAxis: string[]
  series: LineChartSeries[]
}

export interface LineChartConfig {
  showLegend?: boolean
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  showTooltip?: boolean
  showGrid?: boolean
  gridConfig?: {
    left?: string | number
    right?: string | number
    top?: string | number
    bottom?: string | number
    containLabel?: boolean
  }
  xAxisConfig?: {
    name?: string
    axisLabel?: {
      rotate?: number
      interval?: number | 'auto'
    }
  }
  yAxisConfig?: {
    name?: string
    min?: number | 'auto'
    max?: number | 'auto'
    splitNumber?: number
  }
  colors?: string[]
  animation?: boolean
}

// Props 定义
interface Props {
  title?: string
  data: LineChartData
  config?: LineChartConfig
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
  return !props.data?.series?.length || props.data.series.every(s => !s.data?.length)
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

// 生成图表配置
const generateOption = (): EChartsOption => {
  const { config, data } = props

  const option: EChartsOption = {
    color: config.colors || defaultColors,
    tooltip: config.showTooltip !== false ? {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    } : undefined,
    legend: config.showLegend !== false ? {
      show: true,
      type: 'scroll',
      orient: config.legendPosition === 'left' || config.legendPosition === 'right'
        ? 'vertical'
        : 'horizontal',
      left: config.legendPosition === 'right' ? 'right' :
            config.legendPosition === 'left' ? 'left' : 'center',
      top: config.legendPosition === 'bottom' ? 'bottom' : 'top',
      itemWidth: 14,
      itemHeight: 10,
      textStyle: {
        fontSize: 12,
        color: '#666'
      }
    } : undefined,
    grid: {
      left: config.gridConfig?.left ?? '3%',
      right: config.gridConfig?.right ?? '4%',
      top: config.gridConfig?.top ?? (config.showLegend !== false ? 60 : 30),
      bottom: config.gridConfig?.bottom ?? '3%',
      containLabel: config.gridConfig?.containLabel ?? true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.xAxis || [],
      name: config.xAxisConfig?.name,
      nameTextStyle: {
        color: '#666',
        fontSize: 12
      },
      axisLine: {
        lineStyle: {
          color: '#d9d9d9'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#d9d9d9'
        }
      },
      axisLabel: {
        color: '#666',
        fontSize: 11,
        rotate: config.xAxisConfig?.axisLabel?.rotate ?? 0,
        interval: config.xAxisConfig?.axisLabel?.interval ?? 'auto'
      }
    },
    yAxis: {
      type: 'value',
      name: config.yAxisConfig?.name,
      nameTextStyle: {
        color: '#666',
        fontSize: 12
      },
      min: config.yAxisConfig?.min ?? 'auto',
      max: config.yAxisConfig?.max ?? 'auto',
      splitNumber: config.yAxisConfig?.splitNumber ?? 5,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: (data.series || []).map(item => ({
      name: item.name,
      type: 'line',
      data: item.data || [],
      smooth: item.smooth ?? true,
      showSymbol: item.showSymbol ?? false,
      symbolSize: item.symbolSize ?? 6,
      areaStyle: item.areaStyle ?? undefined,
      lineStyle: {
        width: item.lineStyle?.width ?? 2,
        type: item.lineStyle?.type ?? 'solid',
        color: item.lineStyle?.color
      },
      itemStyle: item.itemStyle,
      stack: item.stack,
      emphasis: {
        focus: 'series'
      }
    })),
    animation: config.animation !== false,
    animationDuration: 800,
    animationEasing: 'cubicOut'
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
.line-chart-container {
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