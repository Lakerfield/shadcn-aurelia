import { customElement } from 'aurelia'
import { UiSpinner } from '@/registry/default/ui/spinner'

const TEMPLATE = `
<div class="flex items-center gap-4">
  <ui-spinner></ui-spinner>
  <ui-spinner class="size-6"></ui-spinner>
  <ui-spinner class="size-8 text-muted-foreground"></ui-spinner>
</div>
`

@customElement({ name: 'spinner-demo', template: TEMPLATE, dependencies: [UiSpinner] })
export class SpinnerDemo {}
