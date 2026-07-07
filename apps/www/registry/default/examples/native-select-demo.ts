import { customElement } from 'aurelia'
import { UiNativeSelectAttribute } from '@/registry/default/ui/native-select'

const TEMPLATE = `
<select ui-native-select aria-label="Select a fruit">
  <option value="">Select a fruit</option>
  <option value="apple">Apple</option>
  <option value="banana">Banana</option>
  <option value="cherry">Cherry</option>
</select>
`

@customElement({
  name: 'native-select-demo',
  template: TEMPLATE,
  dependencies: [UiNativeSelectAttribute],
})
export class NativeSelectDemo {}
