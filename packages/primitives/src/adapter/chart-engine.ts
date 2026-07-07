/**
 * Chart engine — chart.js behind the facade (plan open question #5 resolved:
 * chart.js over D3 recipes — vanilla, canvas-based, no framework binding).
 *
 *   const engine = createChartEngine(canvas, { type: 'bar', data, options })
 *   engine.destroy()
 */
import { Chart, registerables, type ChartConfiguration, type ChartType } from 'chart.js'

Chart.register(...registerables)

export type ChartEngine = Chart

export const createChartEngine = (
  canvas: HTMLCanvasElement,
  configuration: ChartConfiguration,
): ChartEngine => new Chart(canvas, configuration)

export type { ChartConfiguration, ChartData, ChartOptions, ChartType, ChartDataset } from 'chart.js'
