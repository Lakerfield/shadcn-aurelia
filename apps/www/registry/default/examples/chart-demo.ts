import { customElement } from 'aurelia'
import { UiChartContainer, type ChartConfig } from '@/registry/default/ui/chart'
import type { ChartData } from '@shadcn-aurelia/primitives'

const TEMPLATE = `
<ui-chart-container type="bar" config.bind="chartConfig" data.bind="chartData"
                    label="Desktop and mobile visitors for the first half of the year"
                    class="min-h-[200px] w-full max-w-lg">
</ui-chart-container>
`

@customElement({ name: 'chart-demo', template: TEMPLATE, dependencies: [UiChartContainer] })
export class ChartDemo {
  chartConfig: ChartConfig = {
    desktop: { label: 'Desktop', color: 'var(--chart-1)' },
    mobile: { label: 'Mobile', color: 'var(--chart-2)' },
  }

  chartData: ChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Desktop',
        data: [186, 305, 237, 73, 209, 214],
        backgroundColor: 'var(--color-desktop)',
        borderRadius: 4,
      },
      {
        label: 'Mobile',
        data: [80, 200, 120, 190, 130, 140],
        backgroundColor: 'var(--color-mobile)',
        borderRadius: 4,
      },
    ],
  }
}
