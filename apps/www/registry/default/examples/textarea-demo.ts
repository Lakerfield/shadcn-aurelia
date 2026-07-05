import { customElement } from 'aurelia'
import { UiTextarea } from '@/registry/default/ui/textarea'

const TEMPLATE = `
<ui-textarea placeholder="Type your message here." class="max-w-sm"></ui-textarea>
`

@customElement({ name: 'textarea-demo', template: TEMPLATE, dependencies: [UiTextarea] })
export class TextareaDemo {}
