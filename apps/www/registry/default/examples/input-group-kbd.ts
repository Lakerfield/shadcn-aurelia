import { customElement } from 'aurelia'
import {
  UiInputGroup,
  UiInputGroupAddon,
  UiInputGroupInputAttribute,
} from '@/registry/default/ui/input-group'
import { UiKbd } from '@/registry/default/ui/kbd'

const TEMPLATE = `
<ui-input-group class="max-w-sm">
  <input ui-input-group-input placeholder="Type to search…" aria-label="Search">
  <ui-input-group-addon align="inline-end">
    <ui-kbd>⌘K</ui-kbd>
  </ui-input-group-addon>
</ui-input-group>
`

@customElement({
  name: 'input-group-kbd',
  template: TEMPLATE,
  dependencies: [UiInputGroup, UiInputGroupAddon, UiInputGroupInputAttribute, UiKbd],
})
export class InputGroupKbd {}
