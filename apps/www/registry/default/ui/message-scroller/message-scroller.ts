/**
 * ui-message-scroller — chat transcript viewport with follow-bottom autoscroll,
 * turn anchoring and scroll-to-edge buttons.
 *
 * Anatomy:
 *   <ui-message-scroller-provider auto-scroll.bind="true">
 *     <ui-message-scroller>
 *       <ui-message-scroller-viewport>
 *         <ui-message-scroller-content>
 *           <ui-message-scroller-item repeat.for="m of messages"
 *                                     message-id.bind="m.id">…</ui-message-scroller-item>
 *         </ui-message-scroller-content>
 *       </ui-message-scroller-viewport>
 *       <ui-message-scroller-button></ui-message-scroller-button>
 *     </ui-message-scroller>
 *   </ui-message-scroller-provider>
 *
 * Behavior comes from the native message-scroller engine in
 * @shadcn-aurelia/primitives (modes following-bottom / free-scrolling /
 * anchored-to-message, data-scrollable / data-autoscrolling attributes,
 * prepend preservation, scrollToMessage queueing).
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import {
  createContext,
  createMessageScrollerEngine,
  type Context,
  type MessageScrollerEngine,
  type MessageScrollerDefaultScrollPosition,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'
import { buttonVariants, type ButtonVariants } from '@/registry/default/ui/button'

export const messageScrollerContext: Context<MessageScrollerEngine> =
  createContext<MessageScrollerEngine>()

const coerceBool = (value: unknown): boolean => value === true || value === 'true' || value === ''
const coerceNumber = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value))
  return Number.isFinite(n) ? n : fallback
}

@customElement({ name: 'ui-message-scroller-provider', template: '<au-slot></au-slot>' })
export class UiMessageScrollerProvider {
  @bindable({ attribute: 'auto-scroll' }) autoScroll: boolean | string = false
  @bindable({ attribute: 'default-scroll-position' })
  defaultScrollPosition: MessageScrollerDefaultScrollPosition = 'end'
  @bindable({ attribute: 'scroll-edge-threshold' }) scrollEdgeThreshold: number | string = 8
  @bindable({ attribute: 'scroll-previous-item-peek' }) scrollPreviousItemPeek: number | string = 64
  @bindable({ attribute: 'scroll-margin' }) scrollMargin: number | string = 0
  @bindable({ attribute: 'preserve-scroll-on-prepend' }) preserveScrollOnPrepend: boolean | string =
    true

  readonly host: HTMLElement = resolve(INode) as HTMLElement
  engine!: MessageScrollerEngine

  created(): void {
    this.host.style.display = 'contents'
  }

  binding(): void {
    this.engine = createMessageScrollerEngine({
      autoScroll: coerceBool(this.autoScroll),
      defaultScrollPosition: this.defaultScrollPosition,
      scrollEdgeThreshold: coerceNumber(this.scrollEdgeThreshold, 8),
      scrollPreviousItemPeek: coerceNumber(this.scrollPreviousItemPeek, 64),
      scrollMargin: coerceNumber(this.scrollMargin, 0),
      preserveScrollOnPrepend:
        this.preserveScrollOnPrepend !== false && this.preserveScrollOnPrepend !== 'false',
    })
    messageScrollerContext.set(this.host, this.engine)
  }

  unbinding(): void {
    this.engine.destroy()
    messageScrollerContext.delete(this.host)
  }

  /** Programmatic commands, e.g. `component.ref="scroller"` → `scroller.scrollToEnd()`. */
  scrollToEnd(behavior: ScrollBehavior = 'smooth'): void {
    this.engine.scrollToEnd({ behavior })
  }

  scrollToStart(behavior: ScrollBehavior = 'smooth'): void {
    this.engine.scrollToStart({ behavior })
  }

  scrollToMessage(messageId: string, behavior: ScrollBehavior = 'auto'): void {
    this.engine.scrollToMessage(messageId, { behavior })
  }
}

@customElement({ name: 'ui-message-scroller', template: '<au-slot></au-slot>' })
export class UiMessageScroller {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private engine: MessageScrollerEngine | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message-scroller')
    this.host.className = cn(
      'group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden',
      author,
    )
  }

  attaching(): void {
    this.engine = messageScrollerContext.get(this.host) ?? null
    this.engine?.setRoot(this.host)
  }

  detaching(): void {
    this.engine?.setRoot(null)
    this.engine = null
  }
}

@customElement({ name: 'ui-message-scroller-viewport', template: '<au-slot></au-slot>' })
export class UiMessageScrollerViewport {
  /** Accessible name for the scroll region. */
  @bindable() label = 'Messages'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private engine: MessageScrollerEngine | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message-scroller-viewport')
    if (!this.host.hasAttribute('role')) this.host.setAttribute('role', 'region')
    if (!this.host.hasAttribute('aria-label')) this.host.setAttribute('aria-label', this.label)
    if (!this.host.hasAttribute('tabindex')) this.host.setAttribute('tabindex', '0')
    this.host.className = cn(
      'size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content data-autoscrolling:scrollbar-none',
      author,
    )
  }

  attaching(): void {
    this.engine = messageScrollerContext.get(this.host) ?? null
    this.engine?.setViewport(this.host)
  }

  detaching(): void {
    this.engine?.setViewport(null)
    this.engine = null
  }
}

@customElement({ name: 'ui-message-scroller-content', template: '<au-slot></au-slot>' })
export class UiMessageScrollerContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private engine: MessageScrollerEngine | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message-scroller-content')
    if (!this.host.hasAttribute('role')) this.host.setAttribute('role', 'log')
    if (!this.host.hasAttribute('aria-relevant'))
      this.host.setAttribute('aria-relevant', 'additions')
    this.host.className = cn('flex h-max min-h-full flex-col gap-8', author)
  }

  attached(): void {
    this.engine = messageScrollerContext.get(this.host) ?? null
    this.engine?.setContent(this.host)
  }

  detaching(): void {
    this.engine?.setContent(null)
    this.engine = null
  }
}

@customElement({ name: 'ui-message-scroller-item', template: '<au-slot></au-slot>' })
export class UiMessageScrollerItem {
  @bindable({ attribute: 'message-id' }) messageId = ''
  @bindable({ attribute: 'scroll-anchor' }) scrollAnchor: boolean | string = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private engine: MessageScrollerEngine | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message-scroller-item')
    if (this.messageId) this.host.setAttribute('data-message-id', this.messageId)
    this.host.setAttribute('data-scroll-anchor', coerceBool(this.scrollAnchor) ? 'true' : 'false')
    this.host.className = cn(
      'min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]',
      author,
    )
  }

  attached(): void {
    this.engine = messageScrollerContext.get(this.host) ?? null
    if (this.messageId) this.engine?.registerItem(this.messageId, this.host)
  }

  detaching(): void {
    if (this.messageId) this.engine?.registerItem(this.messageId, null, this.host)
    this.engine = null
  }
}

const ARROW_DOWN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>`

const BUTTON_TEMPLATE = `
<button ref="button" class.bind="classes" type="button" click.trigger="onClick()"
        data-slot="message-scroller-button"
        data-direction.bind="direction" data-active.bind="active ? 'true' : 'false'"
        tabindex.bind="active ? 0 : -1">
  <au-slot>${ARROW_DOWN_SVG}<span class="sr-only">Scroll to \${direction}</span></au-slot>
</button>
`

@customElement({ name: 'ui-message-scroller-button', template: BUTTON_TEMPLATE })
export class UiMessageScrollerButton {
  @bindable() direction: 'start' | 'end' = 'end'
  @bindable() behavior: ScrollBehavior = 'smooth'
  @bindable() variant: ButtonVariants['variant'] = 'secondary'
  @bindable() size: ButtonVariants['size'] = 'icon-sm'

  button?: HTMLButtonElement
  active = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private engine: MessageScrollerEngine | null = null
  private disposeSubscription: (() => void) | null = null
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  attached(): void {
    this.engine = messageScrollerContext.get(this.host) ?? null
    this.disposeSubscription =
      this.engine?.subscribe((state) => {
        this.active = this.direction === 'start' ? state.start : state.end
        this.button?.toggleAttribute('inert', !this.active)
      }) ?? null
  }

  detaching(): void {
    this.disposeSubscription?.()
    this.disposeSubscription = null
    this.engine = null
  }

  onClick(): void {
    if (!this.active || !this.engine) return
    this.button?.blur()
    if (this.direction === 'start') this.engine.scrollToStart({ behavior: this.behavior })
    else this.engine.scrollToEnd({ behavior: this.behavior })
  }

  get classes(): string {
    return cn(
      buttonVariants({ variant: this.variant, size: this.size }),
      'absolute inset-s-1/2 -translate-x-1/2 border-border bg-background text-foreground transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)] data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180',
      this.authorClasses,
    )
  }
}
