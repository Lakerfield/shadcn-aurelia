import { customElement } from 'aurelia'
import { UiLabel } from '@/registry/default/ui/label'
import { UiInput } from '@/registry/default/ui/input'

const TEMPLATE = `
<div class="grid w-full max-w-sm gap-2">
  <ui-label for="label-demo-email">Email address</ui-label>
  <ui-input id="label-demo-email" type="email" placeholder="you@example.com"></ui-input>
</div>
`

@customElement({ name: 'label-demo', template: TEMPLATE, dependencies: [UiLabel, UiInput] })
export class LabelDemo {}
