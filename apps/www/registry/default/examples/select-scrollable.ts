import { customElement } from 'aurelia'
import {
  UiSelect,
  UiSelectTrigger,
  UiSelectContent,
  UiSelectItem,
  UiSelectGroup,
  UiSelectLabel,
  UiSelectSeparator,
} from '@/registry/default/ui/select'

const TEMPLATE = `
<ui-select value.two-way="timezone" placeholder="Select a timezone">
  <ui-select-trigger class="w-[280px]"></ui-select-trigger>
  <ui-select-content class="max-h-64">
    <ui-select-group>
      <ui-select-label>North America</ui-select-label>
      <ui-select-item repeat.for="tz of northAmerica" value.bind="tz.value" label.bind="tz.label">\${tz.label}</ui-select-item>
    </ui-select-group>
    <ui-select-separator></ui-select-separator>
    <ui-select-group>
      <ui-select-label>Europe & Africa</ui-select-label>
      <ui-select-item repeat.for="tz of europe" value.bind="tz.value" label.bind="tz.label">\${tz.label}</ui-select-item>
    </ui-select-group>
  </ui-select-content>
</ui-select>
`

@customElement({
  name: 'select-scrollable',
  template: TEMPLATE,
  dependencies: [
    UiSelect,
    UiSelectTrigger,
    UiSelectContent,
    UiSelectItem,
    UiSelectGroup,
    UiSelectLabel,
    UiSelectSeparator,
  ],
})
export class SelectScrollable {
  timezone = ''
  northAmerica = [
    { value: 'est', label: 'Eastern Standard Time (EST)' },
    { value: 'cst', label: 'Central Standard Time (CST)' },
    { value: 'mst', label: 'Mountain Standard Time (MST)' },
    { value: 'pst', label: 'Pacific Standard Time (PST)' },
    { value: 'akst', label: 'Alaska Standard Time (AKST)' },
  ]
  europe = [
    { value: 'gmt', label: 'Greenwich Mean Time (GMT)' },
    { value: 'cet', label: 'Central European Time (CET)' },
    { value: 'eet', label: 'Eastern European Time (EET)' },
    { value: 'west', label: 'Western European Summer Time (WEST)' },
  ]
}
