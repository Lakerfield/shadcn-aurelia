import { customElement } from 'aurelia'
import {
  UiField,
  UiFieldLabel,
  UiFieldTitle,
  UiFieldDescription,
  UiFieldContent,
  UiFieldGroup,
} from '@/registry/default/ui/field'
import { UiCheckbox } from '@/registry/default/ui/checkbox'

const TEMPLATE = `
<ui-field-group class="w-full max-w-md">
  <ui-field-label>
    <ui-field orientation="horizontal">
      <ui-checkbox checked.bind="touchId"></ui-checkbox>
      <ui-field-content>
        <ui-field-title>Enable Touch ID</ui-field-title>
        <ui-field-description>Use your fingerprint to unlock the app quickly.</ui-field-description>
      </ui-field-content>
    </ui-field>
  </ui-field-label>
  <ui-field-label>
    <ui-field orientation="horizontal">
      <ui-checkbox checked.bind="cloudBackup"></ui-checkbox>
      <ui-field-content>
        <ui-field-title>Enable cloud backup</ui-field-title>
        <ui-field-description>Your data is encrypted and stored securely.</ui-field-description>
      </ui-field-content>
    </ui-field>
  </ui-field-label>
</ui-field-group>
`

@customElement({
  name: 'field-choice-card',
  template: TEMPLATE,
  dependencies: [
    UiField,
    UiFieldLabel,
    UiFieldTitle,
    UiFieldDescription,
    UiFieldContent,
    UiFieldGroup,
    UiCheckbox,
  ],
})
export class FieldChoiceCard {
  touchId = true
  cloudBackup = false
}
