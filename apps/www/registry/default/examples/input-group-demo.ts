import { customElement } from 'aurelia'
import {
  UiInputGroup,
  UiInputGroupAddon,
  UiInputGroupInputAttribute,
} from '@/registry/default/ui/input-group'

const TEMPLATE = `
<ui-input-group class="max-w-sm">
  <ui-input-group-addon>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  </ui-input-group-addon>
  <input ui-input-group-input type="search" placeholder="Search…" aria-label="Search">
</ui-input-group>
`

@customElement({
  name: 'input-group-demo',
  template: TEMPLATE,
  dependencies: [UiInputGroup, UiInputGroupAddon, UiInputGroupInputAttribute],
})
export class InputGroupDemo {}
