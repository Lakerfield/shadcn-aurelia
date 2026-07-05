import { customElement } from 'aurelia'
import { UiKbd, UiKbdGroup } from '@/registry/default/ui/kbd'

const TEMPLATE = `
<p class="text-muted-foreground max-w-sm text-sm">
  Press
  <ui-kbd-group>
    <ui-kbd>Ctrl</ui-kbd><ui-kbd>B</ui-kbd>
  </ui-kbd-group>
  to toggle the sidebar, or <ui-kbd>/</ui-kbd> to focus search.
</p>
`

@customElement({ name: 'kbd-inline', template: TEMPLATE, dependencies: [UiKbd, UiKbdGroup] })
export class KbdInline {}
