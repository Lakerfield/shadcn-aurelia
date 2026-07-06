/**
 * ui-hover-card family — Zag hover-card behind the facade. The trigger applies
 * its props to the host so any hoverable/focusable child (typically a link)
 * activates the card.
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createHoverCardBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type HoverCardApi,
  type BehaviorSource,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export const hoverCardContext = createContext<UiHoverCard>()

@customElement({ name: 'ui-hover-card', template: '<au-slot></au-slot>' })
export class UiHoverCard implements BehaviorSource<HoverCardApi> {
  @bindable({ mode: BindingMode.twoWay }) open = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createHoverCardBehavior()
  private sync: ControlledSync<boolean> | null = null

  get api(): HoverCardApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    hoverCardContext.set(this.host, this)
    this.sync = createControlledSync<boolean>({
      host: this.host,
      eventName: 'open-change',
      setMachineValue: (v) => this.behavior.api?.setOpen(v),
      setBindable: (v) => (this.open = v),
    })
    this.behavior.init({
      id: createId('hover-card'),
      defaultOpen: this.open,
      onOpenChange: (d: { open: boolean }) => this.sync?.fromMachine(d.open),
    })
  }

  attached(): void {
    this.behavior.start()
  }

  openChanged(v: boolean): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.behavior.stop()
    hoverCardContext.delete(this.host)
  }
}

@customElement({ name: 'ui-hover-card-trigger', template: '<au-slot></au-slot>' })
export class UiHoverCardTrigger {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  attached(): void {
    const card = hoverCardContext.get(this.host)
    if (!card) {
      console.warn('[ui-hover-card-trigger] No parent <ui-hover-card> found')
      return
    }
    this.dispose = bindPart(card, this.host, (api) => api.getTriggerProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="hover-card-positioner">
  <div ref="contentEl" data-slot="hover-card-content" class.bind="classes">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-hover-card-content', template: CONTENT_TEMPLATE })
export class UiHoverCardContent {
  positionerEl!: HTMLDivElement
  contentEl!: HTMLDivElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(
      'bg-popover text-popover-foreground z-50 w-64 rounded-md border p-4 shadow-md outline-hidden',
      this.authorClasses,
    )
  }

  attached(): void {
    const card = hoverCardContext.get(this.host)
    document.body.appendChild(this.host)
    if (!card) {
      console.warn('[ui-hover-card-content] No parent <ui-hover-card> found')
      return
    }
    this.disposers = [
      bindPart(card, this.positionerEl, (api) => api.getPositionerProps()),
      bindPart(card, this.contentEl, (api) => api.getContentProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}
