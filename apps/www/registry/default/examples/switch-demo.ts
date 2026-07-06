import { customElement } from 'aurelia'
import { UiSwitch } from '@/registry/default/ui/switch'

const TEMPLATE = `
<ui-switch>Airplane mode</ui-switch>
`

@customElement({ name: 'switch-demo', template: TEMPLATE, dependencies: [UiSwitch] })
export class SwitchDemo {}
