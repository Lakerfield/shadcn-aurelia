/**
 * ui-popover family — Zag popover behind the facade. Content is portaled and
 * anchor-positioned; Zag handles focus management and dismissal.
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createPopoverBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type PopoverApi,
  type BehaviorSource,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export const popoverContext = createContext<UiPopover>()

@customElement({ name: 'ui-popover', template: '<au-slot></au-slot>' })
export class UiPopover implements BehaviorSource<PopoverApi> {
  @bindable({ mode: BindingMode.twoWay }) open = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createPopoverBehavior()
  private sync: ControlledSync<boolean> | null = null

  get api(): PopoverApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    popoverContext.set(this.host, this)
    this.sync = createControlledSync<boolean>({
      host: this.host,
      eventName: 'open-change',
      setMachineValue: (v) => this.behavior.api?.setOpen(v),
      setBindable: (v) => (this.open = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('popover'),
      defaultOpen: this.open,
      portalled: true,
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
    popoverContext.delete(this.host)
  }
}

const TRIGGER_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="popover-trigger">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-popover-trigger', template: TRIGGER_TEMPLATE })
export class UiPopoverTrigger {
  btn!: HTMLButtonElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(this.authorClasses)
  }

  attached(): void {
    const popover = popoverContext.get(this.host)
    if (!popover) {
      console.warn('[ui-popover-trigger] No parent <ui-popover> found')
      return
    }
    this.dispose = bindPart(popover, this.btn, (api) => api.getTriggerProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="popover-positioner">
  <div ref="contentEl" data-slot="popover-content" class.bind="classes">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-popover-content', template: CONTENT_TEMPLATE })
export class UiPopoverContent {
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
      'bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md outline-hidden',
      this.authorClasses,
    )
  }

  attached(): void {
    const popover = popoverContext.get(this.host)
    document.body.appendChild(this.host)
    if (!popover) {
      console.warn('[ui-popover-content] No parent <ui-popover> found')
      return
    }
    this.disposers = [
      bindPart(popover, this.positionerEl, (api) => api.getPositionerProps()),
      bindPart(popover, this.contentEl, (api) => api.getContentProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}
