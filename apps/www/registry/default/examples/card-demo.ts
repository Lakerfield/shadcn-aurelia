import { customElement } from 'aurelia'
import {
  UiCard,
  UiCardHeader,
  UiCardTitle,
  UiCardDescription,
  UiCardAction,
  UiCardContent,
  UiCardFooter,
} from '@/registry/default/ui/card'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-card class="w-full max-w-sm">
  <ui-card-header>
    <ui-card-title>Meeting notes</ui-card-title>
    <ui-card-description>Transcript from the design sync.</ui-card-description>
    <ui-card-action>
      <ui-button variant="ghost" size="sm">Share</ui-button>
    </ui-card-action>
  </ui-card-header>
  <ui-card-content>
    <p class="text-sm">
      Reviewed the component authoring conventions and agreed to ship the
      static batch before the interactive primitives.
    </p>
  </ui-card-content>
  <ui-card-footer class="gap-2">
    <ui-button>Approve</ui-button>
    <ui-button variant="outline">Comment</ui-button>
  </ui-card-footer>
</ui-card>
`

@customElement({
  name: 'card-demo',
  template: TEMPLATE,
  dependencies: [
    UiCard,
    UiCardHeader,
    UiCardTitle,
    UiCardDescription,
    UiCardAction,
    UiCardContent,
    UiCardFooter,
    UiButton,
  ],
})
export class CardDemo {}
