/**
 * ui-menubar — a row of menu machines with menubar coordination:
 *   • hover-switch: while one menu is open, hovering another trigger moves
 *     the open menu there (Radix menubar behavior)
 *   • ArrowLeft/ArrowRight on triggers roves focus (and the open menu)
 *
 * Each <ui-menubar-menu> owns its own Zag menu machine and provides the shared
 * `menuContext`, so all ui-dropdown-menu item parts compose inside
 * <ui-menubar-content> unchanged.
 *
 *   <ui-menubar>
 *     <ui-menubar-menu>
 *       <ui-menubar-trigger>File</ui-menubar-trigger>
 *       <ui-menubar-content>
 *         <ui-dropdown-menu-item>New Tab</ui-dropdown-menu-item>
 *       </ui-menubar-content>
 *     </ui-menubar-menu>
 *   </ui-menubar>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createMenuBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type MenuApi,
} from '@shadcn-aurelia/primitives'
import { menuContext, menuContentClasses, type MenuSource } from '@/registry/default/ui/dropdown-menu'
import { cn } from '@/registry/default/lib/cn'

export interface MenubarCoordinator {
  register(menu: UiMenubarMenu): () => void
  notifyOpen(menu: UiMenubarMenu): void
  notifyClosed(menu: UiMenubarMenu): void
  hoverSwitch(target: UiMenubarMenu): void
  focusSibling(from: UiMenubarMenu, direction: 1 | -1): void
}

export const menubarContext = createContext<MenubarCoordinator>()

@customElement({ name: 'ui-menubar', template: '<au-slot></au-slot>' })
export class UiMenubar implements MenubarCoordinator {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly menus: UiMenubarMenu[] = []
  private openMenu: UiMenubarMenu | null = null

  binding(): void {
    menubarContext.set(this.host, this)
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'menubar')
    this.host.setAttribute('role', 'menubar')
    this.host.className = cn(
      'bg-background flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs',
      author,
    )
  }

  register(menu: UiMenubarMenu): () => void {
    this.menus.push(menu)
    return () => {
      const i = this.menus.indexOf(menu)
      if (i >= 0) this.menus.splice(i, 1)
      if (this.openMenu === menu) this.openMenu = null
    }
  }

  notifyOpen(menu: UiMenubarMenu): void {
    if (this.openMenu && this.openMenu !== menu) this.openMenu.api?.setOpen(false)
    this.openMenu = menu
  }

  notifyClosed(menu: UiMenubarMenu): void {
    if (this.openMenu === menu) this.openMenu = null
  }

  hoverSwitch(target: UiMenubarMenu): void {
    if (this.openMenu && this.openMenu !== target) {
      this.openMenu.api?.setOpen(false)
      target.api?.setOpen(true)
      this.openMenu = target
    }
  }

  focusSibling(from: UiMenubarMenu, direction: 1 | -1): void {
    if (this.menus.length === 0) return
    const i = this.menus.indexOf(from)
    const next = this.menus[(i + direction + this.menus.length) % this.menus.length]
    const wasOpen = this.openMenu !== null
    if (wasOpen) this.openMenu?.api?.setOpen(false)
    next.focusTrigger()
    if (wasOpen) {
      next.api?.setOpen(true)
      this.openMenu = next
    }
  }

  detaching(): void {
    menubarContext.delete(this.host)
  }
}

@customElement({ name: 'ui-menubar-menu', template: '<au-slot></au-slot>' })
export class UiMenubarMenu implements MenuSource {
  @bindable({ mode: BindingMode.twoWay }) open = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createMenuBehavior()
  private sync: ControlledSync<boolean> | null = null
  private unregister: (() => void) | null = null
  private coordinator: MenubarCoordinator | null = null
  triggerEl: HTMLButtonElement | null = null

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

  get menubar(): MenubarCoordinator | null {
    return this.coordinator
  }

  focusTrigger(): void {
    this.triggerEl?.focus()
  }

  created(): void {
    this.host.style.display = 'contents'
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
      id: createId('menubar-menu'),
      defaultOpen: this.open,
      positioning: { placement: 'bottom-start', gutter: 8 },
      onOpenChange: (d: { open: boolean }) => {
        this.sync?.fromMachine(d.open)
        if (d.open) this.coordinator?.notifyOpen(this)
        else this.coordinator?.notifyClosed(this)
      },
      onSelect: (d: { value: string }) => {
        this.host.dispatchEvent(new CustomEvent('select', { detail: { value: d.value }, bubbles: true }))
      },
    })
  }

  attached(): void {
    this.behavior.start()
    this.coordinator = menubarContext.get(this.host) ?? null
    this.unregister = this.coordinator?.register(this) ?? null
  }

  openChanged(v: boolean): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.unregister?.()
    this.unregister = null
    this.behavior.stop()
    menuContext.delete(this.host)
  }
}

export const menubarMenuContext = createContext<UiMenubarMenu>()

const TRIGGER_TEMPLATE = `
<button ref="btn" type="button" role="menuitem" class.bind="classes" data-slot="menubar-trigger"
        pointerenter.trigger="onPointerEnter()" keydown.trigger="onKeydown($event)">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-menubar-trigger', template: TRIGGER_TEMPLATE })
export class UiMenubarTrigger {
  btn!: HTMLButtonElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private menu: UiMenubarMenu | null = null
  private dispose: (() => void) | null = null
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(
      'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none',
      this.authorClasses,
    )
  }

  onPointerEnter(): void {
    this.menu?.menubar?.hoverSwitch(this.menu)
  }

  onKeydown(e: KeyboardEvent): boolean {
    if (!this.menu) return true
    if (e.key === 'ArrowRight') {
      this.menu.menubar?.focusSibling(this.menu, 1)
      return false
    }
    if (e.key === 'ArrowLeft') {
      this.menu.menubar?.focusSibling(this.menu, -1)
      return false
    }
    return true
  }

  attached(): void {
    const source = menuContext.get(this.host)
    if (!source || !(source instanceof UiMenubarMenu)) {
      console.warn('[ui-menubar-trigger] No parent <ui-menubar-menu> found')
      return
    }
    this.menu = source
    this.menu.triggerEl = this.btn
    this.dispose = bindPart(this.menu, this.btn, (api) => api.getTriggerProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
    if (this.menu?.triggerEl === this.btn) this.menu.triggerEl = null
  }
}

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="menubar-positioner">
  <div ref="contentEl" data-slot="menubar-content" class.bind="classes">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-menubar-content', template: CONTENT_TEMPLATE })
export class UiMenubarContent {
  positionerEl!: HTMLDivElement
  contentEl!: HTMLDivElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(menuContentClasses, 'min-w-[12rem]', this.authorClasses)
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    document.body.appendChild(this.host)
    if (!menu) {
      console.warn('[ui-menubar-content] No parent <ui-menubar-menu> found')
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
