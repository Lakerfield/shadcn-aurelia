import { customElement } from 'aurelia'
import {
  UiCard,
  UiCardHeader,
  UiCardTitle,
  UiCardDescription,
  UiCardContent,
  UiCardFooter,
} from '@/registry/default/ui/card'
import { UiField, UiFieldGroup, UiFieldLabel } from '@/registry/default/ui/field'
import { UiInput } from '@/registry/default/ui/input'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex w-full max-w-sm flex-col gap-6">
  <ui-card>
    <ui-card-header>
      <ui-card-title>Login to your account</ui-card-title>
      <ui-card-description>Enter your email below to login to your account</ui-card-description>
    </ui-card-header>
    <ui-card-content>
      <form novalidate submit.trigger="login()">
        <ui-field-group>
          <ui-field>
            <ui-field-label>Email</ui-field-label>
            <ui-input type="email" value.bind="email" placeholder="m@example.com" required></ui-input>
          </ui-field>
          <ui-field>
            <div class="flex items-center">
              <ui-field-label>Password</ui-field-label>
              <a href="#" class="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                Forgot your password?
              </a>
            </div>
            <ui-input type="password" value.bind="password" required></ui-input>
          </ui-field>
          <ui-field>
            <ui-button type="submit" class="w-full">Login</ui-button>
            <ui-button variant="outline" class="w-full">Login with Google</ui-button>
          </ui-field>
        </ui-field-group>
      </form>
    </ui-card-content>
    <ui-card-footer class="justify-center text-sm">
      Don't have an account?&nbsp;<a href="#" class="underline underline-offset-4">Sign up</a>
    </ui-card-footer>
  </ui-card>
</div>
`

@customElement({
  name: 'login-form',
  template: TEMPLATE,
  dependencies: [
    UiCard,
    UiCardHeader,
    UiCardTitle,
    UiCardDescription,
    UiCardContent,
    UiCardFooter,
    UiField,
    UiFieldGroup,
    UiFieldLabel,
    UiInput,
    UiButton,
  ],
})
export class LoginForm {
  email = ''
  password = ''

  login(): void {
    // Wire up your authentication here.
  }
}
