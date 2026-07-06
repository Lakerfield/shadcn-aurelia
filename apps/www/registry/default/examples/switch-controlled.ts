import { customElement } from 'aurelia'
import { UiSwitch } from '@/registry/default/ui/switch'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex flex-col items-start gap-3">
  <ui-switch checked.two-way="notifications">Notifications: \${notifications ? 'on' : 'off'}</ui-switch>
  <ui-button variant="outline" size="sm" click.trigger="notifications = !notifications">
    Toggle from outside
  </ui-button>
</div>
`

@customElement({ name: 'switch-controlled', template: TEMPLATE, dependencies: [UiSwitch, UiButton] })
export class SwitchControlled {
  notifications = true
}
