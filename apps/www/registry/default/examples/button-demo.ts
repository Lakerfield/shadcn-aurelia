import { customElement } from 'aurelia'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-button>Button</ui-button>
`

@customElement({ name: 'button-demo', template: TEMPLATE, dependencies: [UiButton] })
export class ButtonDemo {}
