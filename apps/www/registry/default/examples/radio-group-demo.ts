import { customElement } from 'aurelia'
import { UiRadioGroup, UiRadioGroupItem } from '@/registry/default/ui/radio-group'

const TEMPLATE = `
<ui-radio-group value="comfortable">
  <ui-radio-group-item value="default">Default</ui-radio-group-item>
  <ui-radio-group-item value="comfortable">Comfortable</ui-radio-group-item>
  <ui-radio-group-item value="compact">Compact</ui-radio-group-item>
</ui-radio-group>
`

@customElement({
  name: 'radio-group-demo',
  template: TEMPLATE,
  dependencies: [UiRadioGroup, UiRadioGroupItem],
})
export class RadioGroupDemo {}
