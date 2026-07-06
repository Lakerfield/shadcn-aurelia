import { customElement } from 'aurelia'
import {
  UiMessageScrollerProvider,
  UiMessageScroller,
  UiMessageScrollerViewport,
  UiMessageScrollerContent,
  UiMessageScrollerItem,
  UiMessageScrollerButton,
} from '@/registry/default/ui/message-scroller'
import {
  UiMessage,
  UiMessageAvatar,
  UiMessageContent,
  UiMessageFooter,
} from '@/registry/default/ui/message'
import { UiBubble, UiBubbleContent } from '@/registry/default/ui/bubble'
import { UiMarker, UiMarkerContent } from '@/registry/default/ui/marker'
import {
  UiAttachment,
  UiAttachmentMedia,
  UiAttachmentContent,
  UiAttachmentTitle,
  UiAttachmentDescription,
} from '@/registry/default/ui/attachment'
import { UiAvatar, UiAvatarFallback } from '@/registry/default/ui/avatar'
import { UiButton } from '@/registry/default/ui/button'

interface ChatEntry {
  id: string
  kind: 'marker' | 'message'
  align?: 'start' | 'end'
  from?: string
  text?: string
  footer?: string
  attachment?: { name: string; size: string }
}

const FILE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>`

const TEMPLATE = `
<div class="flex h-[28rem] w-full max-w-md flex-col gap-3">
  <ui-message-scroller-provider auto-scroll.bind="true">
    <ui-message-scroller class="rounded-lg border">
      <ui-message-scroller-viewport label="Conversation">
        <ui-message-scroller-content class="gap-4 p-4">
          <ui-message-scroller-item repeat.for="entry of entries" message-id.bind="entry.id">
            <ui-marker if.bind="entry.kind === 'marker'" variant="separator">
              <ui-marker-content>\${entry.text}</ui-marker-content>
            </ui-marker>
            <ui-message else align.bind="entry.align">
              <ui-message-avatar if.bind="entry.align === 'start'">
                <ui-avatar class="size-8">
                  <ui-avatar-fallback>\${entry.from}</ui-avatar-fallback>
                </ui-avatar>
              </ui-message-avatar>
              <ui-message-content>
                <ui-bubble variant.bind="entry.align === 'end' ? 'default' : 'secondary'" align.bind="entry.align">
                  <ui-bubble-content>
                    \${entry.text}
                    <ui-attachment if.bind="entry.attachment" size="sm" class="mt-2 bg-background text-foreground">
                      <ui-attachment-media>${FILE_ICON}</ui-attachment-media>
                      <ui-attachment-content>
                        <ui-attachment-title>\${entry.attachment.name}</ui-attachment-title>
                        <ui-attachment-description>\${entry.attachment.size}</ui-attachment-description>
                      </ui-attachment-content>
                    </ui-attachment>
                  </ui-bubble-content>
                </ui-bubble>
                <ui-message-footer if.bind="entry.footer">\${entry.footer}</ui-message-footer>
              </ui-message-content>
            </ui-message>
          </ui-message-scroller-item>
        </ui-message-scroller-content>
      </ui-message-scroller-viewport>
      <ui-message-scroller-button></ui-message-scroller-button>
    </ui-message-scroller>
  </ui-message-scroller-provider>
  <div class="flex gap-2">
    <ui-button size="sm" click.trigger="reply()" disabled.bind="streaming">\${streaming ? 'Streaming…' : 'Stream a reply'}</ui-button>
  </div>
</div>
`

@customElement({
  name: 'chat-demo',
  template: TEMPLATE,
  dependencies: [
    UiMessageScrollerProvider,
    UiMessageScroller,
    UiMessageScrollerViewport,
    UiMessageScrollerContent,
    UiMessageScrollerItem,
    UiMessageScrollerButton,
    UiMessage,
    UiMessageAvatar,
    UiMessageContent,
    UiMessageFooter,
    UiBubble,
    UiBubbleContent,
    UiMarker,
    UiMarkerContent,
    UiAttachment,
    UiAttachmentMedia,
    UiAttachmentContent,
    UiAttachmentTitle,
    UiAttachmentDescription,
    UiAvatar,
    UiAvatarFallback,
    UiButton,
  ],
})
export class ChatDemo {
  streaming = false
  private replyCount = 0
  private timer: ReturnType<typeof setInterval> | null = null

  entries: ChatEntry[] = [
    { id: 'day1', kind: 'marker', text: 'Yesterday' },
    { id: 'c1', kind: 'message', align: 'start', from: 'AB', text: 'Here is the final report for review.', attachment: { name: 'q2-report.pdf', size: '1.8 MB' } },
    { id: 'c2', kind: 'message', align: 'end', text: 'Thanks! I will take a look this afternoon.', footer: 'Read' },
    { id: 'day2', kind: 'marker', text: 'Today' },
    { id: 'c3', kind: 'message', align: 'start', from: 'AB', text: 'Any feedback on the numbers in section 3?' },
    { id: 'c4', kind: 'message', align: 'end', text: 'Looks solid. One question about the churn figure — can you double-check the cohort?' },
  ]

  reply(): void {
    if (this.streaming) return
    this.streaming = true
    this.replyCount++
    const id = `r${this.replyCount}`
    const words =
      'Checked it — the cohort was off by one week. Corrected churn is 3.2 percent, which is in line with the previous quarter.'.split(' ')
    let shown = 0
    this.entries = [...this.entries, { id, kind: 'message', align: 'start', from: 'AB', text: '' }]
    this.timer = setInterval(() => {
      shown++
      const entry = this.entries.find((e) => e.id === id)
      if (entry) entry.text = words.slice(0, shown).join(' ')
      if (shown >= words.length) {
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        this.streaming = false
      }
    }, 120)
  }

  detaching(): void {
    if (this.timer) clearInterval(this.timer)
  }
}
