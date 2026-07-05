import { customElement } from 'aurelia'
import { UiNativeSelectAttribute } from '@/registry/default/ui/native-select'
import { UiLabel } from '@/registry/default/ui/label'

const TEMPLATE = `
<div class="grid w-full max-w-xs gap-2">
  <ui-label for="native-select-tz">Timezone</ui-label>
  <select ui-native-select id="native-select-tz" class="w-full" value.bind="timezone">
    <optgroup label="Europe">
      <option value="cet">Central European Time</option>
      <option value="gmt">Greenwich Mean Time</option>
    </optgroup>
    <optgroup label="America">
      <option value="est">Eastern Standard Time</option>
      <option value="pst">Pacific Standard Time</option>
    </optgroup>
  </select>
  <p class="text-muted-foreground text-sm">Selected: \${timezone}</p>
</div>
`

@customElement({
  name: 'native-select-label',
  template: TEMPLATE,
  dependencies: [UiNativeSelectAttribute, UiLabel],
})
export class NativeSelectLabel {
  timezone = 'cet'
}
