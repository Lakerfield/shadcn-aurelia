/**
 * ui-collapsible family — Zag collapsible behind the facade.
 * The trigger renders a real (unstyled) button; style it with author classes
 * (e.g. buttonVariants) or place non-interactive content inside.
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createCollapsibleBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type CollapsibleApi,
  type BehaviorSource,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export const collapsibleContext = createContext<UiCollapsible>()

@customElement({ name: 'ui-collapsible', template: '<au-slot></au-slot>' })
export class UiCollapsible implements BehaviorSource<CollapsibleApi> {
  @bindable({ mode: BindingMode.twoWay }) open = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createCollapsibleBehavior()
  private sync: ControlledSync<boolean> | null = null
  private disposeRoot: (() => void) | null = null

  get api(): CollapsibleApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    collapsibleContext.set(this.host, this)
    this.sync = createControlledSync<boolean>({
      host: this.host,
      eventName: 'open-change',
      setMachineValue: (v) => this.behavior.api?.setOpen(v),
      setBindable: (v) => (this.open = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('collapsible'),
      defaultOpen: this.open,
      onOpenChange: (d: { open: boolean }) => this.sync?.fromMachine(d.open),
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'collapsible')
    this.host.className = cn('block', author)
  }

  attached(): void {
    this.behavior.start()
    this.disposeRoot = bindPart(this.behavior, this.host, (api) => api.getRootProps())
  }

  openChanged(v: boolean): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.disposeRoot?.()
    this.behavior.stop()
    collapsibleContext.delete(this.host)
  }
}

const TRIGGER_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="collapsible-trigger">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-collapsible-trigger', template: TRIGGER_TEMPLATE })
export class UiCollapsibleTrigger {
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
    const collapsible = collapsibleContext.get(this.host)
    if (!collapsible) {
      console.warn('[ui-collapsible-trigger] No parent <ui-collapsible> found')
      return
    }
    this.dispose = bindPart(collapsible, this.btn, (api) => api.getTriggerProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

@customElement({ name: 'ui-collapsible-content', template: '<au-slot></au-slot>' })
export class UiCollapsibleContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'collapsible-content')
    this.host.className = cn(
      'block overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up',
      author,
    )
  }

  attached(): void {
    const collapsible = collapsibleContext.get(this.host)
    if (collapsible) this.dispose = bindPart(collapsible, this.host, (api) => api.getContentProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}
