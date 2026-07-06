import { customElement } from 'aurelia'
import { UiChartContainer, type ChartConfig } from '@/registry/default/ui/chart'
import type { ChartData } from '@shadcn-aurelia/primitives'

const TEMPLATE = `
<ui-chart-container type="line" config.bind="chartConfig" data.bind="chartData"
                    label="Monthly revenue trend" class="min-h-[200px] w-full max-w-lg">
</ui-chart-container>
`

@customElement({ name: 'chart-line', template: TEMPLATE, dependencies: [UiChartContainer] })
export class ChartLine {
  chartConfig: ChartConfig = {
    revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  }

  chartData: ChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Revenue',
        data: [420, 380, 510, 460, 590, 640],
        borderColor: 'var(--color-revenue)',
        backgroundColor: 'var(--color-revenue)',
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  }
}
