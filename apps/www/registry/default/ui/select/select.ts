/**
 * ui-select family — Zag select behind the facade.
 *
 * Items are declared in markup (shadcn-style); each ui-select-item registers
 * itself with the root, which builds the machine's collection from those
 * registrations (and live-updates it via updateProps when items come and go).
 *
 *   <ui-select value.two-way="fruit" placeholder="Select a fruit">
 *     <ui-select-trigger class="w-[180px]"></ui-select-trigger>
 *     <ui-select-content>
 *       <ui-select-item value="apple">Apple</ui-select-item>
 *     </ui-select-content>
 *   </ui-select>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createSelectBehavior,
  createListCollection,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type SelectApi,
  type BehaviorSource,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export interface SelectItemData {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectOwner extends BehaviorSource<SelectApi> {
  readonly placeholder: string
  registerItem(item: SelectItemData): () => void
}

export const selectContext = createContext<SelectOwner>()

@customElement({ name: 'ui-select', template: '<au-slot></au-slot>' })
export class UiSelect implements SelectOwner {
  @bindable({ mode: BindingMode.twoWay }) value = ''
  @bindable() placeholder = 'Select an option'
  @bindable() disabled = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createSelectBehavior()
  private readonly items: SelectItemData[] = []
  private sync: ControlledSync<string> | null = null
  private started = false

  get api(): SelectApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  registerItem(item: SelectItemData): () => void {
    this.items.push(item)
    if (this.started) this.refreshCollection()
    return () => {
      const i = this.items.indexOf(item)
      if (i >= 0) this.items.splice(i, 1)
      if (this.started) this.refreshCollection()
    }
  }

  private buildCollection() {
    return createListCollection({
      items: [...this.items],
      itemToValue: (item) => item.value,
      itemToString: (item) => item.label,
      isItemDisabled: (item) => !!item.disabled,
    })
  }

  private refreshCollection(): void {
    this.behavior.updateProps({ collection: this.buildCollection() })
  }

  binding(): void {
    selectContext.set(this.host, this)
    this.sync = createControlledSync<string>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.behavior.api?.setValue(v ? [v] : []),
      setBindable: (v) => (this.value = v),
    })
  }

  attached(): void {
    // Items registered during their own attached() (bottom-up, before ours),
    // so the collection is complete here — init right before start.
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('select'),
      collection: this.buildCollection(),
      defaultValue: this.value ? [this.value] : [],
      disabled: this.disabled,
      positioning: { placement: 'bottom-start', gutter: 4, sameWidth: true },
      onValueChange: (d: { value: string[] }) => this.sync?.fromMachine(d.value[0] ?? ''),
    })
    this.behavior.start()
    this.started = true
  }

  valueChanged(v: string): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.started = false
    this.behavior.stop()
    selectContext.delete(this.host)
  }
}

const CHEVRON_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 opacity-50"><path d="m6 9 6 6 6-6"></path></svg>`

const TRIGGER_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="select-trigger" data-size.bind="size">
  <span ref="valueEl" data-slot="select-value" class="line-clamp-1 flex items-center gap-2"></span>
  ${CHEVRON_DOWN}
</button>
`

@customElement({ name: 'ui-select-trigger', template: TRIGGER_TEMPLATE })
export class UiSelectTrigger {
  @bindable() size: 'sm' | 'default' = 'default'

  btn!: HTMLButtonElement
  valueEl!: HTMLSpanElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(
      "border-input data-[placeholder-shown]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      this.authorClasses,
    )
  }

  attached(): void {
    const select = selectContext.get(this.host)
    if (!select) {
      console.warn('[ui-select-trigger] No parent <ui-select> found')
      return
    }
    const updateValueText = () => {
      const api = select.api
      this.valueEl.textContent = api?.valueAsString || select.placeholder
    }
    updateValueText()
    // role=combobox does not take its name from contents, and Zag points
    // aria-labelledby at a label part we don't render — relabel the trigger
    // with the value text element instead.
    const valueId = createId('select-value')
    this.valueEl.id = valueId
    this.disposers = [
      bindPart(select, this.btn, (api) => ({
        ...api.getTriggerProps(),
        'aria-labelledby': valueId,
      })),
      select.subscribe(updateValueText),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="select-positioner">
  <div ref="contentEl" data-slot="select-content" class.bind="classes">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-select-content', template: CONTENT_TEMPLATE })
export class UiSelectContent {
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
      'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 max-h-(--available-height) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md outline-hidden',
      this.authorClasses,
    )
  }

  attached(): void {
    const select = selectContext.get(this.host)
    document.body.appendChild(this.host)
    if (!select) {
      console.warn('[ui-select-content] No parent <ui-select> found')
      return
    }
    this.disposers = [
      bindPart(select, this.positionerEl, (api) => api.getPositionerProps()),
      bindPart(select, this.contentEl, (api) => api.getContentProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M20 6 9 17l-5-5"></path></svg>`

const ITEM_TEMPLATE = `
<span data-slot="select-item-text"><au-slot></au-slot></span>
<span class="absolute right-2 flex size-3.5 items-center justify-center">
  <span ref="indicatorEl" data-slot="select-item-indicator">${CHECK_ICON}</span>
</span>
`

@customElement({ name: 'ui-select-item', template: ITEM_TEMPLATE })
export class UiSelectItem {
  @bindable() value = ''
  @bindable() disabled = false
  /** Collection label; defaults to the item's text content. */
  @bindable() label = ''

  indicatorEl!: HTMLSpanElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private itemData: SelectItemData | null = null
  private unregister: (() => void) | null = null
  private disposers: Array<() => void> = []

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'select-item')
    this.host.className = cn(
      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      author,
    )
  }

  attached(): void {
    const select = selectContext.get(this.host)
    if (!select) {
      console.warn('[ui-select-item] No parent <ui-select> found')
      return
    }
    this.itemData = {
      value: this.value,
      label: this.label || this.host.textContent?.trim() || this.value,
      disabled: this.disabled,
    }
    this.unregister = select.registerItem(this.itemData)
    this.disposers = [
      bindPart(select, this.host, (api) => api.getItemProps({ item: this.itemData! })),
      bindPart(select, this.indicatorEl, (api) =>
        api.getItemIndicatorProps({ item: this.itemData! }),
      ),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    this.unregister?.()
    this.unregister = null
  }
}

@customElement({ name: 'ui-select-group', template: '<au-slot></au-slot>' })
export class UiSelectGroup {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly groupId = createId('select-group')
  private dispose: (() => void) | null = null

  bound(): void {
    this.host.setAttribute('data-slot', 'select-group')
    this.host.className = cn('block', this.host.getAttribute('class') ?? '')
  }

  attached(): void {
    const select = selectContext.get(this.host)
    if (!select) return
    this.dispose = bindPart(select, this.host, (api) => api.getItemGroupProps({ id: this.groupId }))
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

@customElement({ name: 'ui-select-label', template: '<au-slot></au-slot>' })
export class UiSelectLabel {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'select-label')
    this.host.className = cn('text-muted-foreground block px-2 py-1.5 text-xs', author)
  }
}

@customElement({ name: 'ui-select-separator', template: '' })
export class UiSelectSeparator {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'select-separator')
    this.host.setAttribute('aria-hidden', 'true')
    this.host.className = cn('bg-border pointer-events-none -mx-1 my-1 block h-px', author)
  }
}
