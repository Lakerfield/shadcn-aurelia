import { customElement } from 'aurelia'
import { UiBubble, UiBubbleContent, UiBubbleGroup } from '@/registry/default/ui/bubble'

const TEMPLATE = `
<div class="flex w-full max-w-md flex-col gap-4">
  <ui-bubble>
    <ui-bubble-content>Default bubbles use the primary color for the active user side of a chat.</ui-bubble-content>
  </ui-bubble>
  <ui-bubble variant="secondary">
    <ui-bubble-content>Secondary bubbles are the standard neutral surface for assistant content.</ui-bubble-content>
  </ui-bubble>
  <ui-bubble variant="muted">
    <ui-bubble-content>Muted bubbles lower the emphasis for quiet system notes.</ui-bubble-content>
  </ui-bubble>
  <ui-bubble variant="tinted" align="end">
    <ui-bubble-content>Tinted bubbles use a softer primary tint when primary fill is too strong.</ui-bubble-content>
  </ui-bubble>
  <ui-bubble variant="outline">
    <ui-bubble-content>Outline bubbles frame message content with a border.</ui-bubble-content>
  </ui-bubble>
  <ui-bubble variant="destructive">
    <ui-bubble-content>Destructive bubbles flag errors or failed actions in a conversation.</ui-bubble-content>
  </ui-bubble>
  <ui-bubble variant="ghost">
    <ui-bubble-content>Ghost bubbles work for assistant text that should not be framed and can take the full width of the container.</ui-bubble-content>
  </ui-bubble>
  <ui-bubble-group>
    <ui-bubble align="end"><ui-bubble-content>Grouped bubbles…</ui-bubble-content></ui-bubble>
    <ui-bubble align="end"><ui-bubble-content>…stack with a tight gap.</ui-bubble-content></ui-bubble>
  </ui-bubble-group>
</div>
`

@customElement({
  name: 'bubble-demo',
  template: TEMPLATE,
  dependencies: [UiBubble, UiBubbleContent, UiBubbleGroup],
})
export class BubbleDemo {}
