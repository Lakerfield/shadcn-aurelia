import { customElement } from 'aurelia'
import {
  UiMessageScrollerProvider,
  UiMessageScroller,
  UiMessageScrollerViewport,
  UiMessageScrollerContent,
  UiMessageScrollerItem,
  UiMessageScrollerButton,
} from '@/registry/default/ui/message-scroller'
import { UiBubble, UiBubbleContent } from '@/registry/default/ui/bubble'
import { UiButton } from '@/registry/default/ui/button'

interface DemoMessage {
  id: string
  align: 'start' | 'end'
  text: string
}

const TEMPLATE = `
<div class="flex h-96 w-full max-w-md flex-col gap-3">
  <ui-message-scroller-provider auto-scroll.bind="true" component.ref="scroller">
    <ui-message-scroller class="rounded-lg border">
      <ui-message-scroller-viewport>
        <ui-message-scroller-content class="gap-3 p-4">
          <ui-message-scroller-item repeat.for="m of messages" message-id.bind="m.id">
            <ui-bubble variant.bind="m.align === 'end' ? 'default' : 'secondary'" align.bind="m.align" class="max-w-[85%]">
              <ui-bubble-content>\${m.text}</ui-bubble-content>
            </ui-bubble>
          </ui-message-scroller-item>
        </ui-message-scroller-content>
      </ui-message-scroller-viewport>
      <ui-message-scroller-button></ui-message-scroller-button>
    </ui-message-scroller>
  </ui-message-scroller-provider>
  <div class="flex gap-2">
    <ui-button size="sm" click.trigger="append()">Append message</ui-button>
    <ui-button size="sm" variant="outline" click.trigger="prepend()">Prepend older</ui-button>
  </div>
</div>
`

@customElement({
  name: 'message-scroller-demo',
  template: TEMPLATE,
  dependencies: [
    UiMessageScrollerProvider,
    UiMessageScroller,
    UiMessageScrollerViewport,
    UiMessageScrollerContent,
    UiMessageScrollerItem,
    UiMessageScrollerButton,
    UiBubble,
    UiBubbleContent,
    UiButton,
  ],
})
export class MessageScrollerDemo {
  scroller?: UiMessageScrollerProvider

  private appendCount = 0
  private prependCount = 0

  messages: DemoMessage[] = Array.from({ length: 14 }, (_, i) => ({
    id: `m${i + 1}`,
    align: i % 3 === 2 ? 'end' : 'start',
    text:
      i % 3 === 2
        ? `Got it — message ${i + 1}.`
        : `This is message ${i + 1} in the transcript. Scroll up and the follow-bottom releases; the button brings you back.`,
  }))

  append(): void {
    this.appendCount++
    this.messages = [
      ...this.messages,
      {
        id: `a${this.appendCount}`,
        align: this.appendCount % 2 === 0 ? 'end' : 'start',
        text: `Appended message ${this.appendCount} — while you are at the bottom the viewport follows.`,
      },
    ]
  }

  prepend(): void {
    this.prependCount++
    this.messages = [
      {
        id: `p${this.prependCount}`,
        align: 'start',
        text: `Older message ${this.prependCount} — prepends keep your reading position.`,
      },
      ...this.messages,
    ]
  }
}
