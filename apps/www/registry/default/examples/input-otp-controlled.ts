import { customElement } from 'aurelia'
import { UiInputOtp } from '@/registry/default/ui/input-otp'

const TEMPLATE = `
<div class="flex flex-col items-start gap-3">
  <ui-input-otp count="4" value.two-way="code"></ui-input-otp>
  <p class="text-muted-foreground text-sm">Code: \${code || '—'}</p>
</div>
`

@customElement({ name: 'input-otp-controlled', template: TEMPLATE, dependencies: [UiInputOtp] })
export class InputOtpControlled {
  code = ''
}
