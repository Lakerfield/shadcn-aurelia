import { customElement } from 'aurelia'
import { UiLabel } from '@/registry/default/ui/label'

const TEMPLATE = `
<div class="flex items-center gap-2">
  <input type="checkbox" id="label-demo-terms" class="size-4 accent-primary">
  <ui-label for="label-demo-terms">Accept terms and conditions</ui-label>
</div>
`

@customElement({ name: 'label-checkbox', template: TEMPLATE, dependencies: [UiLabel] })
export class LabelCheckbox {}
