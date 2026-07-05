import { customElement } from 'aurelia'
import { UiInput } from '@/registry/default/ui/input'

const TEMPLATE = `
<ui-input type="email" placeholder="Email" class="max-w-sm"></ui-input>
`

@customElement({ name: 'input-demo', template: TEMPLATE, dependencies: [UiInput] })
export class InputDemo {}
