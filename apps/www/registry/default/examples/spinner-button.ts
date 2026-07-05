import { customElement } from 'aurelia'
import { UiSpinner } from '@/registry/default/ui/spinner'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-button disabled.bind="true">
  <ui-spinner></ui-spinner>
  Saving…
</ui-button>
`

@customElement({ name: 'spinner-button', template: TEMPLATE, dependencies: [UiSpinner, UiButton] })
export class SpinnerButton {}
