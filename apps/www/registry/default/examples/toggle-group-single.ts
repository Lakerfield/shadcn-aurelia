import { customElement } from 'aurelia'
import { UiToggleGroup, UiToggleGroupItem } from '@/registry/default/ui/toggle-group'

const TEMPLATE = `
<div class="flex flex-col items-start gap-2">
  <ui-toggle-group type="single" value.two-way="align">
    <ui-toggle-group-item value="left">Left</ui-toggle-group-item>
    <ui-toggle-group-item value="center">Center</ui-toggle-group-item>
    <ui-toggle-group-item value="right">Right</ui-toggle-group-item>
  </ui-toggle-group>
  <span class="text-muted-foreground text-sm">align: \${align}</span>
</div>
`

@customElement({
  name: 'toggle-group-single',
  template: TEMPLATE,
  dependencies: [UiToggleGroup, UiToggleGroupItem],
})
export class ToggleGroupSingle {
  align: string[] = ['center']
}
