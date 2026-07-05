import { customElement } from 'aurelia'
import {
  UiItemGroup,
  UiItem,
  UiItemMedia,
  UiItemContent,
  UiItemTitle,
  UiItemDescription,
} from '@/registry/default/ui/item'

const TEMPLATE = `
<ui-item-group class="w-full max-w-md gap-2">
  <ui-item variant="muted" size="sm">
    <ui-item-media variant="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    </ui-item-media>
    <ui-item-content>
      <ui-item-title>quarterly-report.pdf</ui-item-title>
      <ui-item-description>2.4 MB · updated yesterday</ui-item-description>
    </ui-item-content>
  </ui-item>
  <ui-item variant="muted" size="sm">
    <ui-item-media variant="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
        <circle cx="9" cy="9" r="2"></circle>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
      </svg>
    </ui-item-media>
    <ui-item-content>
      <ui-item-title>hero-banner.png</ui-item-title>
      <ui-item-description>860 KB · updated 2 days ago</ui-item-description>
    </ui-item-content>
  </ui-item>
</ui-item-group>
`

@customElement({
  name: 'item-group-demo',
  template: TEMPLATE,
  dependencies: [UiItemGroup, UiItem, UiItemMedia, UiItemContent, UiItemTitle, UiItemDescription],
})
export class ItemGroupDemo {}
