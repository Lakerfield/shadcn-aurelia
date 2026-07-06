import { customElement } from 'aurelia'
import { UiCheckbox } from '@/registry/default/ui/checkbox'

const TEMPLATE = `
<div class="flex flex-col gap-3">
  <ui-checkbox>Accept terms and conditions</ui-checkbox>
  <ui-checkbox checked.bind="true">Enabled by default</ui-checkbox>
  <ui-checkbox disabled.bind="true">Disabled</ui-checkbox>
</div>
`

@customElement({ name: 'checkbox-demo', template: TEMPLATE, dependencies: [UiCheckbox] })
export class CheckboxDemo {}
