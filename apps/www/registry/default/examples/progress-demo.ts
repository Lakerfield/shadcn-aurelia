import { customElement } from 'aurelia'
import { UiProgress } from '@/registry/default/ui/progress'

const TEMPLATE = `
<ui-progress class="max-w-sm" value.bind="66"></ui-progress>
`

@customElement({ name: 'progress-demo', template: TEMPLATE, dependencies: [UiProgress] })
export class ProgressDemo {}
