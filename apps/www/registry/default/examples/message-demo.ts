import { customElement } from 'aurelia'
import {
  UiMessage,
  UiMessageAvatar,
  UiMessageContent,
  UiMessageHeader,
  UiMessageFooter,
} from '@/registry/default/ui/message'
import { UiBubble, UiBubbleContent } from '@/registry/default/ui/bubble'
import { UiAvatar, UiAvatarImage, UiAvatarFallback } from '@/registry/default/ui/avatar'

const TEMPLATE = `
<div class="flex w-full max-w-md flex-col gap-6">
  <ui-message>
    <ui-message-avatar>
      <ui-avatar class="size-8">
        <ui-avatar-image src="https://github.com/shadcn.png" alt="@shadcn"></ui-avatar-image>
        <ui-avatar-fallback>CN</ui-avatar-fallback>
      </ui-avatar>
    </ui-message-avatar>
    <ui-message-content>
      <ui-message-header>shadcn · 9:41 AM</ui-message-header>
      <ui-bubble variant="secondary">
        <ui-bubble-content>Hey! Did you see the new chat components?</ui-bubble-content>
      </ui-bubble>
      <ui-bubble variant="secondary">
        <ui-bubble-content>They compose with message rows, bubbles and markers.</ui-bubble-content>
      </ui-bubble>
      <ui-message-footer>Delivered</ui-message-footer>
    </ui-message-content>
  </ui-message>

  <ui-message align="end">
    <ui-message-content>
      <ui-bubble align="end">
        <ui-bubble-content>Just tried them — the alignment flips with a single attribute.</ui-bubble-content>
      </ui-bubble>
      <ui-message-footer>Read · 9:42 AM</ui-message-footer>
    </ui-message-content>
  </ui-message>
</div>
`

@customElement({
  name: 'message-demo',
  template: TEMPLATE,
  dependencies: [
    UiMessage,
    UiMessageAvatar,
    UiMessageContent,
    UiMessageHeader,
    UiMessageFooter,
    UiBubble,
    UiBubbleContent,
    UiAvatar,
    UiAvatarImage,
    UiAvatarFallback,
  ],
})
export class MessageDemo {}
