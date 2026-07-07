/**
 * ui-context-menu — Zag menu opened via right-click / long-press.
 *
 * Thin layer over the shared menu machinery: the root provides the same
 * `menuContext` as ui-dropdown-menu, so ALL dropdown-menu item parts
 * (ui-dropdown-menu-item, -checkbox-item, -radio-group, -sub, …) compose
 * inside <ui-context-menu-content> unchanged.
 *
 *   <ui-context-menu>
 *     <ui-context-menu-trigger class="…">Right click here</ui-context-menu-trigger>
 *     <ui-context-menu-content>
 *       <ui-dropdown-menu-item>Back</ui-dropdown-menu-item>
 *     </ui-context-menu-content>
 *   </ui-context-menu>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createMenuBehavior,
  createControlledSync,
  createId,
  bindPart,
  type ControlledSync,
  type MenuApi,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import {
  menuContext,
  menuContentClasses,
  type MenuSource,
} from '@/registry/default/ui/dropdown-menu'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-context-menu', template: '<au-slot></au-slot>' })
export class UiContextMenu implements MenuSource {
  @bindable({ mode: BindingMode.twoWay }) open = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createMenuBehavior()
  private sync: ControlledSync<boolean> | null = null

  get api(): MenuApi | null {
    return this.behavior.api
  }

  get service(): unknown {
    return this.behavior.service
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  notify(): void {
    this.behavior.notify()
  }

  binding(): void {
    menuContext.set(this.host, this)
    this.sync = createControlledSync<boolean>({
      host: this.host,
      eventName: 'open-change',
      setMachineValue: (v) => this.behavior.api?.setOpen(v),
      setBindable: (v) => (this.open = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('context-menu'),
      onOpenChange: (d: { open: boolean }) => this.sync?.fromMachine(d.open),
      onSelect: (d: { value: string }) => {
        this.host.dispatchEvent(
          new CustomEvent('select', { detail: { value: d.value }, bubbles: true }),
        )
      },
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
    menuContext.delete(this.host)
  }
}

@customElement({ name: 'ui-context-menu-trigger', template: '<au-slot></au-slot>' })
export class UiContextMenuTrigger {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'context-menu-trigger')
    this.host.className = cn('block', author)
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    if (!menu) {
      console.warn('[ui-context-menu-trigger] No parent <ui-context-menu> found')
      return
    }
    this.dispose = bindPart(menu, this.host, (api) => api.getContextTriggerProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="context-menu-positioner">
  <div ref="contentEl" data-slot="context-menu-content" class.bind="classes">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-context-menu-content', template: CONTENT_TEMPLATE })
export class UiContextMenuContent {
  positionerEl!: HTMLDivElement
  contentEl!: HTMLDivElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(menuContentClasses, this.authorClasses)
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    document.body.appendChild(this.host)
    if (!menu) {
      console.warn('[ui-context-menu-content] No parent <ui-context-menu> found')
      return
    }
    this.disposers = [
      bindPart(menu, this.positionerEl, (api) => api.getPositionerProps()),
      bindPart(menu, this.contentEl, (api) => api.getContentProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}
