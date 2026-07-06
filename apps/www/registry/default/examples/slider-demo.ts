import { customElement } from 'aurelia'
import { UiSlider } from '@/registry/default/ui/slider'

const TEMPLATE = `
<ui-slider class="max-w-sm" value.bind="[50]" max="100" step="1"></ui-slider>
`

@customElement({ name: 'slider-demo', template: TEMPLATE, dependencies: [UiSlider] })
export class SliderDemo {}
