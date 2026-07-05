import { customElement } from 'aurelia'
import { UiAlert, UiAlertTitle, UiAlertDescription } from '@/registry/default/ui/alert'

const TEMPLATE = `
<ui-alert variant="destructive" class="max-w-md">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" x2="12" y1="8" y2="12"></line>
    <line x1="12" x2="12.01" y1="16" y2="16"></line>
  </svg>
  <ui-alert-title>Unable to process your payment.</ui-alert-title>
  <ui-alert-description>
    <p>Please verify your billing information and try again.</p>
  </ui-alert-description>
</ui-alert>
`

@customElement({
  name: 'alert-destructive',
  template: TEMPLATE,
  dependencies: [UiAlert, UiAlertTitle, UiAlertDescription],
})
export class AlertDestructive {}
