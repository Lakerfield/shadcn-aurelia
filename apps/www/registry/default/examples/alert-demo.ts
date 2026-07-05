import { customElement } from 'aurelia'
import { UiAlert, UiAlertTitle, UiAlertDescription } from '@/registry/default/ui/alert'

const TEMPLATE = `
<ui-alert class="max-w-md">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 6 9 17l-5-5"></path>
  </svg>
  <ui-alert-title>Success! Your changes have been saved</ui-alert-title>
  <ui-alert-description>This is an alert with icon, title and description.</ui-alert-description>
</ui-alert>
`

@customElement({ name: 'alert-demo', template: TEMPLATE, dependencies: [UiAlert, UiAlertTitle, UiAlertDescription] })
export class AlertDemo {}
