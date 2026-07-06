import { customElement } from 'aurelia'
import {
  UiBubble,
  UiBubbleContent,
  UiBubbleContentAttribute,
  UiBubbleReactions,
} from '@/registry/default/ui/bubble'

const TEMPLATE = `
<div class="flex w-full max-w-md flex-col gap-8">
  <ui-bubble variant="secondary">
    <ui-bubble-content>Reactions attach to a corner of the bubble.</ui-bubble-content>
    <ui-bubble-reactions>👍 ❤️</ui-bubble-reactions>
  </ui-bubble>
  <ui-bubble align="end">
    <ui-bubble-content>They flip sides with side and align.</ui-bubble-content>
    <ui-bubble-reactions side="top" align="start">🎉</ui-bubble-reactions>
  </ui-bubble>
  <ui-bubble variant="outline">
    <button ui-bubble-content type="button" click.trigger="count = count + 1">
      Interactive bubbles are native buttons or links — click me (\${count})
    </button>
  </ui-bubble>
</div>
`

@customElement({
  name: 'bubble-reactions',
  template: TEMPLATE,
  dependencies: [UiBubble, UiBubbleContent, UiBubbleContentAttribute, UiBubbleReactions],
})
export class BubbleReactions {
  count = 0
}
