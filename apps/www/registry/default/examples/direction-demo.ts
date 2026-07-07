import { customElement } from 'aurelia'
import { UiDirection } from '@/registry/default/ui/direction'
import { UiSlider } from '@/registry/default/ui/slider'
import {
  UiSelect,
  UiSelectTrigger,
  UiSelectContent,
  UiSelectItem,
} from '@/registry/default/ui/select'
import { UiLabel } from '@/registry/default/ui/label'

const TEMPLATE = `
<div class="grid w-full max-w-sm gap-8">
  <div class="grid gap-3">
    <ui-label>LTR (default)</ui-label>
    <ui-slider value.bind="[40]" class="w-full"></ui-slider>
  </div>
  <ui-direction dir="rtl" class="grid gap-3">
    <ui-label>RTL — arrow keys and layout flip</ui-label>
    <ui-slider value.bind="[40]" class="w-full"></ui-slider>
    <ui-select placeholder="بچینید…">
      <ui-select-trigger class="w-[180px]"></ui-select-trigger>
      <ui-select-content>
        <ui-select-item value="one">اول</ui-select-item>
        <ui-select-item value="two">دوم</ui-select-item>
        <ui-select-item value="three">سوم</ui-select-item>
      </ui-select-content>
    </ui-select>
  </ui-direction>
</div>
`

@customElement({
  name: 'direction-demo',
  template: TEMPLATE,
  dependencies: [
    UiDirection,
    UiSlider,
    UiSelect,
    UiSelectTrigger,
    UiSelectContent,
    UiSelectItem,
    UiLabel,
  ],
})
export class DirectionDemo {}
