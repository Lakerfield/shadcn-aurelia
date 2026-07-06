/**
 * ui-dropdown-menu family — Zag menu behind the facade.
 *
 *   <ui-dropdown-menu>
 *     <ui-dropdown-menu-trigger>Open</ui-dropdown-menu-trigger>
 *     <ui-dropdown-menu-content>
 *       <ui-dropdown-menu-item click.trigger="...">Profile</ui-dropdown-menu-item>
 *       <ui-dropdown-menu-checkbox-item checked.two-way="...">…</ui-dropdown-menu-checkbox-item>
 *       <ui-dropdown-menu-sub>
 *         <ui-dropdown-menu-sub-trigger>More</ui-dropdown-menu-sub-trigger>
 *         <ui-dropdown-menu-sub-content>…</ui-dropdown-menu-sub-content>
 *       </ui-dropdown-menu-sub>
 *     </ui-dropdown-menu-content>
 *   </ui-dropdown-menu>
 *
 * Keyboard selection dispatches a real click on the item, so `click.trigger`
 * works for both pointer and keyboard. The root also fires a bubbling
 * 'select' CustomEvent with `detail.value`.
 *
 * `menuContext` is shared with context-menu and menubar so the item parts in
 * this file compose under any menu root.
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
  type BehaviorSource,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

type MenuMachineService = Parameters<MenuApi['setParent']>[0]

/** Any menu machine owner (dropdown root, context-menu root, menubar menu, sub). */
export interface MenuSource extends BehaviorSource<MenuApi> {
  /** Raw machine service — used only for parent/child machine linking. */
  readonly service: unknown
  /** Nearest ancestor menu, when this menu is a submenu. */
  readonly parentMenu?: MenuSource | null
  /** Re-apply all bound parts — for item state living outside the machine. */
  notify(): void
}

export const menuContext = createContext<MenuSource>()

export const menuContentClasses =
  'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 max-h-(--available-height) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md outline-hidden'

export const menuItemClasses =
  "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:data-[highlighted]:bg-destructive/10 dark:data-[variant=destructive]:data-[highlighted]:bg-destructive/20 data-[variant=destructive]:data-[highlighted]:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

@customElement({ name: 'ui-dropdown-menu', template: '<au-slot></au-slot>' })
export class UiDropdownMenu implements MenuSource {
  @bindable({ mode: BindingMode.twoWay }) open = false
  /** Zag positioning placement, e.g. bottom-start / bottom-end / right-start. */
  @bindable() placement = 'bottom-start'

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
      id: createId('menu'),
      defaultOpen: this.open,
      positioning: { placement: this.placement, gutter: 4 },
      onOpenChange: (d: { open: boolean }) => this.sync?.fromMachine(d.open),
      onSelect: (d: { value: string }) => {
        this.host.dispatchEvent(new CustomEvent('select', { detail: { value: d.value }, bubbles: true }))
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

const TRIGGER_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="dropdown-menu-trigger">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-dropdown-menu-trigger', template: TRIGGER_TEMPLATE })
export class UiDropdownMenuTrigger {
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
    const menu = menuContext.get(this.host)
    if (!menu) {
      console.warn('[ui-dropdown-menu-trigger] No parent <ui-dropdown-menu> found')
      return
    }
    this.dispose = bindPart(menu, this.btn, (api) => api.getTriggerProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="dropdown-menu-positioner">
  <div ref="contentEl" data-slot="dropdown-menu-content" class.bind="classes">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-dropdown-menu-content', template: CONTENT_TEMPLATE })
export class UiDropdownMenuContent {
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
      console.warn('[ui-dropdown-menu-content] No parent menu root found')
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

@customElement({ name: 'ui-dropdown-menu-item', template: '<au-slot></au-slot>' })
export class UiDropdownMenuItem {
  @bindable() value = ''
  @bindable() disabled = false
  @bindable() variant: 'default' | 'destructive' = 'default'
  @bindable() inset = false
  /** Typeahead text; defaults to the item's text content. */
  @bindable() textValue = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    if (!this.value) this.value = createId('menu-item')
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'dropdown-menu-item')
    this.host.setAttribute('data-variant', this.variant)
    if (this.inset) this.host.setAttribute('data-inset', '')
    this.host.className = cn(menuItemClasses, author)
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    if (!menu) return
    this.dispose = bindPart(menu, this.host, (api) =>
      api.getItemProps({
        value: this.value,
        disabled: this.disabled || undefined,
        valueText: this.textValue || undefined,
      }),
    )
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M20 6 9 17l-5-5"></path></svg>`

const CHECKBOX_ITEM_TEMPLATE = `
<span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
  <span ref="indicatorEl" data-slot="dropdown-menu-item-indicator">${CHECK_ICON}</span>
</span>
<au-slot></au-slot>
`

@customElement({ name: 'ui-dropdown-menu-checkbox-item', template: CHECKBOX_ITEM_TEMPLATE })
export class UiDropdownMenuCheckboxItem {
  @bindable({ mode: BindingMode.twoWay }) checked = false
  @bindable() value = ''
  @bindable() disabled = false
  @bindable() closeOnSelect = false

  indicatorEl!: HTMLSpanElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private menu: MenuSource | null = null

  checkedChanged(): void {
    // `checked` lives outside the machine; force bound parts to re-read it.
    this.menu?.notify()
  }

  bound(): void {
    if (!this.value) this.value = createId('menu-checkbox')
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'dropdown-menu-checkbox-item')
    this.host.className = cn(
      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      author,
    )
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    if (!menu) return
    this.menu = menu
    this.disposers = [
      bindPart(menu, this.host, (api) =>
        api.getOptionItemProps({
          type: 'checkbox',
          value: this.value,
          checked: this.checked,
          disabled: this.disabled || undefined,
          closeOnSelect: this.closeOnSelect,
          onCheckedChange: (checked: boolean) => {
            this.checked = checked
            this.host.dispatchEvent(new CustomEvent('checked-change', { detail: { checked }, bubbles: true }))
          },
        }),
      ),
      bindPart(menu, this.indicatorEl, (api) =>
        api.getItemIndicatorProps({ value: this.value, checked: this.checked }),
      ),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}

export interface MenuRadioGroupOwner {
  currentValue: string
  select(value: string): void
}

export const menuRadioGroupContext = createContext<MenuRadioGroupOwner>()

@customElement({ name: 'ui-dropdown-menu-radio-group', template: '<au-slot></au-slot>' })
export class UiDropdownMenuRadioGroup implements MenuRadioGroupOwner {
  @bindable({ mode: BindingMode.twoWay }) value = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly groupId = createId('menu-radio-group')
  private dispose: (() => void) | null = null
  private menu: MenuSource | null = null

  get currentValue(): string {
    return this.value
  }

  select(value: string): void {
    this.value = value
    this.host.dispatchEvent(new CustomEvent('value-change', { detail: { value }, bubbles: true }))
  }

  valueChanged(): void {
    // Radio state lives outside the machine; force items to re-read it.
    this.menu?.notify()
  }

  binding(): void {
    menuRadioGroupContext.set(this.host, this)
  }

  bound(): void {
    this.host.setAttribute('data-slot', 'dropdown-menu-radio-group')
    this.host.className = cn('block', this.host.getAttribute('class') ?? '')
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    if (!menu) return
    this.menu = menu
    this.dispose = bindPart(menu, this.host, (api) => api.getItemGroupProps({ id: this.groupId }))
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
    menuRadioGroupContext.delete(this.host)
  }
}

const CIRCLE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-2"><circle cx="12" cy="12" r="10"></circle></svg>`

const RADIO_ITEM_TEMPLATE = `
<span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
  <span ref="indicatorEl" data-slot="dropdown-menu-item-indicator">${CIRCLE_ICON}</span>
</span>
<au-slot></au-slot>
`

@customElement({ name: 'ui-dropdown-menu-radio-item', template: RADIO_ITEM_TEMPLATE })
export class UiDropdownMenuRadioItem {
  @bindable() value = ''
  @bindable() disabled = false
  @bindable() closeOnSelect = false

  indicatorEl!: HTMLSpanElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'dropdown-menu-radio-item')
    this.host.className = cn(
      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      author,
    )
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    const group = menuRadioGroupContext.get(this.host)
    if (!menu || !group) {
      console.warn('[ui-dropdown-menu-radio-item] Needs menu root and radio-group ancestors')
      return
    }
    this.disposers = [
      bindPart(menu, this.host, (api) =>
        api.getOptionItemProps({
          type: 'radio',
          value: this.value,
          checked: group.currentValue === this.value,
          disabled: this.disabled || undefined,
          closeOnSelect: this.closeOnSelect,
          onCheckedChange: (checked: boolean) => {
            if (checked) group.select(this.value)
          },
        }),
      ),
      bindPart(menu, this.indicatorEl, (api) =>
        api.getItemIndicatorProps({ value: this.value, checked: group.currentValue === this.value }),
      ),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}

@customElement({ name: 'ui-dropdown-menu-group', template: '<au-slot></au-slot>' })
export class UiDropdownMenuGroup {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly groupId = createId('menu-group')
  private dispose: (() => void) | null = null

  bound(): void {
    this.host.setAttribute('data-slot', 'dropdown-menu-group')
    this.host.className = cn('block', this.host.getAttribute('class') ?? '')
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    if (!menu) return
    this.dispose = bindPart(menu, this.host, (api) => api.getItemGroupProps({ id: this.groupId }))
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

@customElement({ name: 'ui-dropdown-menu-label', template: '<au-slot></au-slot>' })
export class UiDropdownMenuLabel {
  @bindable() inset = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'dropdown-menu-label')
    if (this.inset) this.host.setAttribute('data-inset', '')
    this.host.className = cn('block px-2 py-1.5 text-sm font-medium data-[inset]:pl-8', author)
  }
}

@customElement({ name: 'ui-dropdown-menu-separator', template: '' })
export class UiDropdownMenuSeparator {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'dropdown-menu-separator')
    this.host.className = cn('bg-border -mx-1 my-1 block h-px', author)
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    if (!menu) return
    this.dispose = bindPart(menu, this.host, (api) => api.getSeparatorProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

@customElement({ name: 'ui-dropdown-menu-shortcut', template: '<au-slot></au-slot>' })
export class UiDropdownMenuShortcut {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'dropdown-menu-shortcut')
    this.host.className = cn('text-muted-foreground ml-auto text-xs tracking-widest', author)
  }
}

@customElement({ name: 'ui-dropdown-menu-sub', template: '<au-slot></au-slot>' })
export class UiDropdownMenuSub implements MenuSource {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createMenuBehavior()
  private _parent: MenuSource | null = null

  get api(): MenuApi | null {
    return this.behavior.api
  }

  get service(): unknown {
    return this.behavior.service
  }

  get parentMenu(): MenuSource | null {
    return this._parent
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  notify(): void {
    this.behavior.notify()
  }

  created(): void {
    this.host.style.display = 'contents'
  }

  binding(): void {
    // Resolve the parent BEFORE shadowing the context for our own subtree.
    this._parent = this.host.parentElement ? (menuContext.get(this.host.parentElement) ?? null) : null
    menuContext.set(this.host, this)
    this.behavior.init({
      id: createId('menu-sub'),
      positioning: { placement: 'right-start', gutter: 0 },
    })
  }

  attached(): void {
    this.behavior.start()
    // Parent machines start in their own attached() (which runs after ours,
    // bottom-up) — defer linking one microtask so both services exist.
    queueMicrotask(() => {
      const parent = this._parent
      if (!parent?.api) {
        console.warn('[ui-dropdown-menu-sub] No parent menu found for machine linking')
        return
      }
      parent.api.setChild(this.behavior.service)
      this.behavior.api?.setParent(parent.service as MenuMachineService)
    })
  }

  detaching(): void {
    this.behavior.stop()
    menuContext.delete(this.host)
  }
}

/** BehaviorSource pairing parent+child apis for getTriggerItemProps. */
function pairSource(parent: MenuSource, child: MenuSource): BehaviorSource<[MenuApi, MenuApi]> {
  return {
    get api(): [MenuApi, MenuApi] | null {
      return parent.api && child.api ? [parent.api, child.api] : null
    },
    subscribe(listener: () => void): () => void {
      const u1 = parent.subscribe(listener)
      const u2 = child.subscribe(listener)
      return () => {
        u1()
        u2()
      }
    },
  }
}

const CHEVRON_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-auto size-4"><path d="m9 18 6-6-6-6"></path></svg>`

@customElement({ name: 'ui-dropdown-menu-sub-trigger', template: `<au-slot></au-slot>${CHEVRON_RIGHT}` })
export class UiDropdownMenuSubTrigger {
  @bindable() inset = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'dropdown-menu-sub-trigger')
    if (this.inset) this.host.setAttribute('data-inset', '')
    this.host.className = cn(
      'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8',
      author,
    )
  }

  attached(): void {
    const sub = menuContext.get(this.host)
    const parent = sub?.parentMenu
    if (!sub || !parent) {
      console.warn('[ui-dropdown-menu-sub-trigger] Needs <ui-dropdown-menu-sub> and a parent menu')
      return
    }
    this.dispose = bindPart(pairSource(parent, sub), this.host, ([parentApi, subApi]) =>
      parentApi.getTriggerItemProps(subApi),
    )
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const SUB_CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="dropdown-menu-sub-positioner">
  <div ref="contentEl" data-slot="dropdown-menu-sub-content" class.bind="classes">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-dropdown-menu-sub-content', template: SUB_CONTENT_TEMPLATE })
export class UiDropdownMenuSubContent {
  positionerEl!: HTMLDivElement
  contentEl!: HTMLDivElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(menuContentClasses, 'shadow-lg', this.authorClasses)
  }

  attached(): void {
    const menu = menuContext.get(this.host)
    document.body.appendChild(this.host)
    if (!menu) {
      console.warn('[ui-dropdown-menu-sub-content] No <ui-dropdown-menu-sub> found')
      return
    }
    // Sub-content portals to <body> BEFORE its parent (attached is bottom-up),
    // so with Zag's uniform --z-index:50 it paints UNDER the parent menu.
    // Raise it by nesting depth.
    let depth = 0
    for (let cur = menu.parentMenu; cur; cur = cur.parentMenu ?? null) depth++
    const zIndex = 50 + depth
    this.disposers = [
      bindPart(menu, this.positionerEl, (api) => {
        const props = api.getPositionerProps()
        const style = typeof props.style === 'string' ? props.style : ''
        return { ...props, style: `${style};z-index:${zIndex}` }
      }),
      bindPart(menu, this.contentEl, (api) => api.getContentProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}
