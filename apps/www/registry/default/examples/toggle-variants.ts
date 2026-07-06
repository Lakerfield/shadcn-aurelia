import { customElement } from 'aurelia'
import { UiToggle } from '@/registry/default/ui/toggle'

const TEMPLATE = `
<div class="flex items-center gap-2">
  <ui-toggle variant="outline" pressed.two-way="bold">Bold</ui-toggle>
  <ui-toggle variant="outline" size="sm">Small</ui-toggle>
  <ui-toggle variant="outline" size="lg">Large</ui-toggle>
  <ui-toggle disabled.bind="true">Disabled</ui-toggle>
  <span class="text-muted-foreground text-sm">bold: \${bold}</span>
</div>
`

@customElement({ name: 'toggle-variants-demo', template: TEMPLATE, dependencies: [UiToggle] })
export class ToggleVariantsDemo {
  bold = true
}
