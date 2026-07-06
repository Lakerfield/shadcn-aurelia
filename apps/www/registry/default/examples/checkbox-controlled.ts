import { customElement } from 'aurelia'
import { UiCheckbox } from '@/registry/default/ui/checkbox'

const TEMPLATE = `
<div class="flex flex-col items-start gap-3">
  <ui-checkbox checked.two-way="subscribed">Subscribe to newsletter</ui-checkbox>
  <p class="text-muted-foreground text-sm">Subscribed: \${subscribed}</p>
</div>
`

@customElement({ name: 'checkbox-controlled', template: TEMPLATE, dependencies: [UiCheckbox] })
export class CheckboxControlled {
  subscribed = false
}
