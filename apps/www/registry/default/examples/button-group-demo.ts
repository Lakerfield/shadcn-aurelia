import { customElement } from 'aurelia'
import { UiButtonGroup } from '@/registry/default/ui/button-group'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-button-group>
  <ui-button variant="outline">Archive</ui-button>
  <ui-button variant="outline">Report</ui-button>
  <ui-button variant="outline">Snooze</ui-button>
</ui-button-group>
`

@customElement({ name: 'button-group-demo', template: TEMPLATE, dependencies: [UiButtonGroup, UiButton] })
export class ButtonGroupDemo {}
