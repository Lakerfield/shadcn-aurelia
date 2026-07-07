import { customElement } from 'aurelia'
import {
  UiCard,
  UiCardHeader,
  UiCardTitle,
  UiCardDescription,
  UiCardContent,
} from '@/registry/default/ui/card'

const TEMPLATE = `
<ui-card class="w-full max-w-sm">
  <ui-card-header>
    <ui-card-title>Total revenue</ui-card-title>
    <ui-card-description>Last 30 days</ui-card-description>
  </ui-card-header>
  <ui-card-content>
    <p class="text-3xl font-semibold tracking-tight">€12.480</p>
  </ui-card-content>
</ui-card>
`

@customElement({
  name: 'card-simple',
  template: TEMPLATE,
  dependencies: [UiCard, UiCardHeader, UiCardTitle, UiCardDescription, UiCardContent],
})
export class CardSimple {}
