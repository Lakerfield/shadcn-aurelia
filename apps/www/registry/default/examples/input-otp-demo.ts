import { customElement } from 'aurelia'
import { UiInputOtp } from '@/registry/default/ui/input-otp'

const TEMPLATE = `
<ui-input-otp count="6" group-size="3"></ui-input-otp>
`

@customElement({ name: 'input-otp-demo', template: TEMPLATE, dependencies: [UiInputOtp] })
export class InputOtpDemo {}
