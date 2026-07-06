import { customElement } from 'aurelia'
import { UiToggle } from '@/registry/default/ui/toggle'

const TEMPLATE = `
<ui-toggle>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" x2="10" y1="4" y2="4"></line>
    <line x1="14" x2="5" y1="20" y2="20"></line>
    <line x1="15" x2="9" y1="4" y2="20"></line>
  </svg>
  Italic
</ui-toggle>
`

@customElement({ name: 'toggle-demo', template: TEMPLATE, dependencies: [UiToggle] })
export class ToggleDemo {}
