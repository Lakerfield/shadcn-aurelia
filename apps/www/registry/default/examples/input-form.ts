import { customElement } from 'aurelia'
import { UiInput } from '@/registry/default/ui/input'
import { UiLabel } from '@/registry/default/ui/label'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<form class="grid w-full max-w-sm gap-4" submit.trigger:prevent="submit()">
  <div class="grid gap-2">
    <ui-label for="input-form-name">Name</ui-label>
    <ui-input id="input-form-name" value.two-way="name" placeholder="Ada Lovelace" required.bind="true"></ui-input>
  </div>
  <div class="grid gap-2">
    <ui-label for="input-form-picture">Picture</ui-label>
    <ui-input id="input-form-picture" type="file"></ui-input>
  </div>
  <div class="grid gap-2">
    <ui-label for="input-form-disabled">Disabled</ui-label>
    <ui-input id="input-form-disabled" disabled.bind="true" placeholder="Disabled"></ui-input>
  </div>
  <ui-button type="submit">Submit\${name ? ' — ' + name : ''}</ui-button>
</form>
`

@customElement({ name: 'input-form', template: TEMPLATE, dependencies: [UiInput, UiLabel, UiButton] })
export class InputForm {
  name = ''

  submit(): void {
    // demo only
  }
}
