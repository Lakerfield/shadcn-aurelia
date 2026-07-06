import { customElement } from 'aurelia'
import { UiSlider } from '@/registry/default/ui/slider'

const TEMPLATE = `
<div class="flex w-full max-w-sm flex-col gap-3">
  <ui-slider value.two-way="range" max="100" step="5"></ui-slider>
  <p class="text-muted-foreground text-sm">Range: \${range[0]} – \${range[1]}</p>
</div>
`

@customElement({ name: 'slider-range', template: TEMPLATE, dependencies: [UiSlider] })
export class SliderRange {
  range: number[] = [25, 75]
}
