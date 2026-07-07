import { customElement } from 'aurelia'
import {
  UiSelect,
  UiSelectTrigger,
  UiSelectContent,
  UiSelectItem,
  UiSelectGroup,
  UiSelectLabel,
} from '@/registry/default/ui/select'

const TEMPLATE = `
<ui-select value.two-way="fruit" placeholder="Select a fruit">
  <ui-select-trigger class="w-[180px]"></ui-select-trigger>
  <ui-select-content>
    <ui-select-group>
      <ui-select-label>Fruits</ui-select-label>
      <ui-select-item value="apple">Apple</ui-select-item>
      <ui-select-item value="banana">Banana</ui-select-item>
      <ui-select-item value="blueberry">Blueberry</ui-select-item>
      <ui-select-item value="grapes" disabled.bind="true">Grapes</ui-select-item>
      <ui-select-item value="pineapple">Pineapple</ui-select-item>
    </ui-select-group>
  </ui-select-content>
</ui-select>
<p class="text-muted-foreground mt-4 text-sm">Selected: \${fruit || '—'}</p>
`

@customElement({
  name: 'select-demo',
  template: TEMPLATE,
  dependencies: [
    UiSelect,
    UiSelectTrigger,
    UiSelectContent,
    UiSelectItem,
    UiSelectGroup,
    UiSelectLabel,
  ],
})
export class SelectDemo {
  fruit = ''
}
