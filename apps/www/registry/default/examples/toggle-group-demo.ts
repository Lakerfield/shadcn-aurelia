import { customElement } from 'aurelia'
import { UiToggleGroup, UiToggleGroupItem } from '@/registry/default/ui/toggle-group'

const TEMPLATE = `
<ui-toggle-group type="multiple" variant="outline">
  <ui-toggle-group-item value="bold">B</ui-toggle-group-item>
  <ui-toggle-group-item value="italic"><i>I</i></ui-toggle-group-item>
  <ui-toggle-group-item value="underline"><u>U</u></ui-toggle-group-item>
</ui-toggle-group>
`

@customElement({
  name: 'toggle-group-demo',
  template: TEMPLATE,
  dependencies: [UiToggleGroup, UiToggleGroupItem],
})
export class ToggleGroupDemo {}
