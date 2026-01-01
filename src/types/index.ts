// 折线图类型
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

// 饼图类型
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