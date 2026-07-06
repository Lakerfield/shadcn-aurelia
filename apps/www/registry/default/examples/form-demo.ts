import { customElement, resolve, newInstanceForScope } from 'aurelia'
import { IValidationRules } from '@aurelia/validation'
import { IValidationController } from '@aurelia/validation-html'
import { UiForm } from '@/registry/default/ui/form'
import {
  UiField,
  UiFieldLabel,
  UiFieldDescription,
  UiFieldError,
  UiFieldGroup,
} from '@/registry/default/ui/field'
import { UiInput } from '@/registry/default/ui/input'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-form controller.bind="controller" valid-submit.trigger="save()" class="w-full max-w-sm">
  <ui-field-group>
    <ui-field name="username">
      <ui-field-label>Username</ui-field-label>
      <ui-input value.bind="model.username & validate" placeholder="shadcn"></ui-input>
      <ui-field-description>This is your public display name.</ui-field-description>
      <ui-field-error></ui-field-error>
    </ui-field>
    <ui-field name="email">
      <ui-field-label>Email</ui-field-label>
      <ui-input type="email" value.bind="model.email & validate" placeholder="m@example.com"></ui-input>
      <ui-field-error></ui-field-error>
    </ui-field>
    <ui-field>
      <ui-button type="submit">Submit</ui-button>
    </ui-field>
    <p if.bind="saved" role="status" class="text-sm text-muted-foreground">
      Profile saved for \${model.username}.
    </p>
  </ui-field-group>
</ui-form>
`

@customElement({
  name: 'form-demo',
  template: TEMPLATE,
  dependencies: [
    UiForm,
    UiField,
    UiFieldLabel,
    UiFieldDescription,
    UiFieldError,
    UiFieldGroup,
    UiInput,
    UiButton,
  ],
})
export class FormDemo {
  private readonly rules = resolve(IValidationRules)
  readonly controller = resolve(newInstanceForScope(IValidationController))

  model = { username: '', email: '' }
  saved = false

  binding(): void {
    this.rules
      .on(this.model)
      .ensure('username')
      .required()
      .withMessage('Username is required.')
      .minLength(3)
      .withMessage('Username must be at least 3 characters.')
      .ensure('email')
      .required()
      .withMessage('Email is required.')
      .email()
      .withMessage('Enter a valid email address.')
  }

  save(): void {
    this.saved = true
  }

  unbinding(): void {
    this.rules.off(this.model)
  }
}
