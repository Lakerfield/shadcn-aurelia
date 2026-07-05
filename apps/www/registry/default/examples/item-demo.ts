import { customElement } from 'aurelia'
import {
  UiItem,
  UiItemContent,
  UiItemTitle,
  UiItemDescription,
  UiItemActions,
} from '@/registry/default/ui/item'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-item variant="outline" class="w-full max-w-md">
  <ui-item-content>
    <ui-item-title>Basic item</ui-item-title>
    <ui-item-description>A simple item with title and description.</ui-item-description>
  </ui-item-content>
  <ui-item-actions>
    <ui-button variant="outline" size="sm">Action</ui-button>
  </ui-item-actions>
</ui-item>
`

@customElement({
  name: 'item-demo',
  template: TEMPLATE,
  dependencies: [UiItem, UiItemContent, UiItemTitle, UiItemDescription, UiItemActions, UiButton],
})
export class ItemDemo {}
