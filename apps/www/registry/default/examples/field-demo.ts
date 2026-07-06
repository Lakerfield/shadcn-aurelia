import { customElement } from 'aurelia'
import {
  UiField,
  UiFieldLabel,
  UiFieldDescription,
  UiFieldContent,
  UiFieldGroup,
  UiFieldSet,
  UiFieldLegend,
  UiFieldSeparator,
} from '@/registry/default/ui/field'
import { UiInput } from '@/registry/default/ui/input'
import { UiTextarea } from '@/registry/default/ui/textarea'
import { UiSwitch } from '@/registry/default/ui/switch'

const TEMPLATE = `
<div class="w-full max-w-md">
  <ui-field-set>
    <ui-field-legend>Profile</ui-field-legend>
    <ui-field-description>This appears on invoices and receipts.</ui-field-description>
    <ui-field-group>
      <ui-field>
        <ui-field-label>Name</ui-field-label>
        <ui-input placeholder="Evil Rabbit" value.bind="name"></ui-input>
        <ui-field-description>Your full name as it appears on your card.</ui-field-description>
      </ui-field>
      <ui-field>
        <ui-field-label>Message</ui-field-label>
        <ui-textarea placeholder="Leave us a message…" value.bind="message"></ui-textarea>
        <ui-field-description>Max 200 characters.</ui-field-description>
      </ui-field>
      <ui-field-separator>Preferences</ui-field-separator>
      <ui-field orientation="horizontal">
        <ui-field-content>
          <ui-field-label>Email notifications</ui-field-label>
          <ui-field-description>Receive an email when something happens.</ui-field-description>
        </ui-field-content>
        <ui-switch checked.bind="notifications"></ui-switch>
      </ui-field>
    </ui-field-group>
  </ui-field-set>
</div>
`

@customElement({
  name: 'field-demo',
  template: TEMPLATE,
  dependencies: [
    UiField,
    UiFieldLabel,
    UiFieldDescription,
    UiFieldContent,
    UiFieldGroup,
    UiFieldSet,
    UiFieldLegend,
    UiFieldSeparator,
    UiInput,
    UiTextarea,
    UiSwitch,
  ],
})
export class FieldDemo {
  name = ''
  message = ''
  notifications = true
}
