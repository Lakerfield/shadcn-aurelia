import { customElement } from 'aurelia'
import { UiKbd, UiKbdGroup } from '@/registry/default/ui/kbd'

const TEMPLATE = `
<div class="flex items-center gap-4 text-sm">
  <ui-kbd-group>
    <ui-kbd>⌘</ui-kbd>
    <ui-kbd>K</ui-kbd>
  </ui-kbd-group>
  <ui-kbd>Esc</ui-kbd>
  <ui-kbd>Enter</ui-kbd>
</div>
`

@customElement({ name: 'kbd-demo', template: TEMPLATE, dependencies: [UiKbd, UiKbdGroup] })
export class KbdDemo {}
