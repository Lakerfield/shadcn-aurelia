import { customElement } from 'aurelia'
import {
  UiField,
  UiFieldGroup,
  UiFieldLabel,
  UiFieldDescription,
  UiFieldSet,
  UiFieldLegend,
  UiFieldSeparator,
  UiFieldContent,
} from '@/registry/default/ui/field'
import { UiInput } from '@/registry/default/ui/input'
import { UiButton } from '@/registry/default/ui/button'
import { UiSwitch } from '@/registry/default/ui/switch'
import {
  UiSelect,
  UiSelectTrigger,
  UiSelectContent,
  UiSelectItem,
} from '@/registry/default/ui/select'

const TEMPLATE = `
<div class="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
  <header class="space-y-1">
    <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
    <p class="text-muted-foreground text-sm">Manage your account settings and preferences.</p>
  </header>

  <form novalidate submit.trigger="save()">
    <ui-field-group>
      <ui-field-set>
        <ui-field-legend>Profile</ui-field-legend>
        <ui-field-group>
          <ui-field name="name">
            <ui-field-label>Name</ui-field-label>
            <ui-input value.bind="model.name" placeholder="Your name"></ui-input>
            <ui-field-description>This is the name shown on your profile.</ui-field-description>
          </ui-field>
          <ui-field name="email">
            <ui-field-label>Email</ui-field-label>
            <ui-input type="email" value.bind="model.email" placeholder="m@example.com"></ui-input>
          </ui-field>
          <ui-field name="timezone">
            <ui-field-label>Timezone</ui-field-label>
            <ui-select value.bind="model.timezone" placeholder="Select a timezone">
              <ui-select-trigger class="w-full"></ui-select-trigger>
              <ui-select-content>
                <ui-select-item repeat.for="tz of timezones" value.bind="tz">\${tz}</ui-select-item>
              </ui-select-content>
            </ui-select>
          </ui-field>
        </ui-field-group>
      </ui-field-set>

      <ui-field-separator></ui-field-separator>

      <ui-field-set>
        <ui-field-legend>Notifications</ui-field-legend>
        <ui-field-group>
          <ui-field orientation="horizontal">
            <ui-field-content>
              <ui-field-label>Email notifications</ui-field-label>
              <ui-field-description>Receive product updates and announcements.</ui-field-description>
            </ui-field-content>
            <ui-switch checked.bind="model.emailNotifications"></ui-switch>
          </ui-field>
          <ui-field orientation="horizontal">
            <ui-field-content>
              <ui-field-label>Security alerts</ui-field-label>
              <ui-field-description>Get notified about sign-ins from new devices.</ui-field-description>
            </ui-field-content>
            <ui-switch checked.bind="model.securityAlerts"></ui-switch>
          </ui-field>
        </ui-field-group>
      </ui-field-set>

      <ui-field-separator></ui-field-separator>

      <ui-field orientation="horizontal">
        <ui-button type="submit">Save changes</ui-button>
        <ui-button type="button" variant="outline" click.trigger="reset()">Reset</ui-button>
        <p if.bind="saved" role="status" class="text-muted-foreground text-sm">Saved.</p>
      </ui-field>
    </ui-field-group>
  </form>
</div>
`

const defaults = () => ({
  name: '',
  email: '',
  timezone: 'Europe/Amsterdam',
  emailNotifications: true,
  securityAlerts: false,
})

@customElement({
  name: 'settings-page',
  template: TEMPLATE,
  dependencies: [
    UiField,
    UiFieldGroup,
    UiFieldLabel,
    UiFieldDescription,
    UiFieldSet,
    UiFieldLegend,
    UiFieldSeparator,
    UiFieldContent,
    UiInput,
    UiButton,
    UiSwitch,
    UiSelect,
    UiSelectTrigger,
    UiSelectContent,
    UiSelectItem,
  ],
})
export class SettingsPage {
  timezones = ['Europe/Amsterdam', 'Europe/London', 'America/New_York', 'Asia/Tokyo', 'UTC']
  model = defaults()
  saved = false

  save(): void {
    this.saved = true
  }

  reset(): void {
    this.model = defaults()
    this.saved = false
  }
}
