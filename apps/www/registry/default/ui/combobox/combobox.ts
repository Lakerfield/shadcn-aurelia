/**
 * ui-combobox family — Zag combobox behind the facade: an autocomplete input
 * with a filtered suggestion list.
 *
 * Items are declared in markup and register with the root; typing filters the
 * machine's collection (via updateProps) and items hide themselves when
 * filtered out.
 *
 *   <ui-combobox value.two-way="framework" placeholder="Search framework…">
 *     <ui-combobox-control class="w-[220px]"></ui-combobox-control>
 *     <ui-combobox-content>
 *       <ui-combobox-item value="aurelia">Aurelia</ui-combobox-item>
 *     </ui-combobox-content>
 *   </ui-combobox>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createComboboxBehavior,
  createListCollection,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type ComboboxApi,
  type BehaviorSource,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export interface ComboboxItemData {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxOwner extends BehaviorSource<ComboboxApi> {
  readonly placeholder: string
  registerItem(item: ComboboxItemData): () => void
  isItemVisible(value: string): boolean
  readonly hasResults: boolean
}

export const comboboxContext = createContext<ComboboxOwner>()

@customElement({ name: 'ui-combobox', template: '<au-slot></au-slot>' })
export class UiCombobox implements ComboboxOwner {
  @bindable({ mode: BindingMode.twoWay }) value = ''
  @bindable() placeholder = 'Search…'
  @bindable() disabled = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createComboboxBehavior()
  private readonly items: ComboboxItemData[] = []
  private visibleValues: Set<string> | null = null // null = no filter (all visible)
  private sync: ControlledSync<string> | null = null
  private started = false

  get api(): ComboboxApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  registerItem(item: ComboboxItemData): () => void {
    this.items.push(item)
    if (this.started) this.refreshCollection()
    return () => {
      const i = this.items.indexOf(item)
      if (i >= 0) this.items.splice(i, 1)
      if (this.started) this.refreshCollection()
    }
  }

  isItemVisible(value: string): boolean {
    return this.visibleValues === null || this.visibleValues.has(value)
  }

  get hasResults(): boolean {
    return this.visibleValues === null ? this.items.length > 0 : this.visibleValues.size > 0
  }

  private filteredItems(): ComboboxItemData[] {
    return this.visibleValues === null
      ? [...this.items]
      : this.items.filter((i) => this.visibleValues!.has(i.value))
  }

  private buildCollection() {
    return createListCollection({
      items: this.filteredItems(),
      itemToValue: (item) => item.value,
      itemToString: (item) => item.label,
      isItemDisabled: (item) => !!item.disabled,
    })
  }

  private refreshCollection(): void {
    this.behavior.updateProps({ collection: this.buildCollection() })
    this.behavior.notify()
  }

  private applyFilter(query: string): void {
    const q = query.trim().toLowerCase()
    this.visibleValues =
      q === ''
        ? null
        : new Set(this.items.filter((i) => i.label.toLowerCase().includes(q)).map((i) => i.value))
    this.refreshCollection()
  }

  binding(): void {
    comboboxContext.set(this.host, this)
    this.sync = createControlledSync<string>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.behavior.api?.setValue(v ? [v] : []),
      setBindable: (v) => (this.value = v),
    })
  }

  attached(): void {
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('combobox'),
      collection: this.buildCollection(),
      defaultValue: this.value ? [this.value] : [],
      disabled: this.disabled,
      placeholder: this.placeholder,
      openOnClick: true,
      positioning: { placement: 'bottom-start', gutter: 4, sameWidth: true },
      onValueChange: (d: { value: string[] }) => this.sync?.fromMachine(d.value[0] ?? ''),
      onInputValueChange: (d: { inputValue: string; reason: string }) => {
        // Only user typing narrows the list; selection/programmatic writes reset it.
        if (d.reason === 'input-change') this.applyFilter(d.inputValue)
        else this.applyFilter('')
      },
      onOpenChange: (d: { open: boolean }) => {
        if (!d.open) this.applyFilter('')
      },
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
    comboboxContext.delete(this.host)
  }
}

const CHEVRONS_UP_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 opacity-50"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>`

const CONTROL_TEMPLATE = `
<div ref="controlEl" data-slot="combobox-control" class="relative">
  <input ref="inputEl" data-slot="combobox-input" class.bind="inputClasses" />
  <button ref="triggerEl" type="button" tabindex="-1" data-slot="combobox-trigger"
          class="absolute inset-y-0 right-2 flex items-center">${CHEVRONS_UP_DOWN}</button>
</div>
`

@customElement({ name: 'ui-combobox-control', template: CONTROL_TEMPLATE })
export class UiComboboxControl {
  controlEl!: HTMLDivElement
  inputEl!: HTMLInputElement
  triggerEl!: HTMLButtonElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'combobox')
    this.host.className = cn('block', this.authorClasses)
  }

  get inputClasses(): string {
    return cn(
      'border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-8 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
    )
  }

  attached(): void {
    const combobox = comboboxContext.get(this.host)
    if (!combobox) {
      console.warn('[ui-combobox-control] No parent <ui-combobox> found')
      return
    }
    this.disposers = [
      bindPart(combobox, this.controlEl, (api) => api.getControlProps()),
      bindPart(combobox, this.inputEl, (api) => api.getInputProps()),
      bindPart(combobox, this.triggerEl, (api) => api.getTriggerProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="combobox-positioner">
  <div ref="contentEl" data-slot="combobox-content" class.bind="classes">
    <au-slot></au-slot>
    <div ref="emptyEl" data-slot="combobox-empty" class="py-6 text-center text-sm">No results found.</div>
  </div>
</div>
`

@customElement({ name: 'ui-combobox-content', template: CONTENT_TEMPLATE })
export class UiComboboxContent {
  positionerEl!: HTMLDivElement
  contentEl!: HTMLDivElement
  emptyEl!: HTMLDivElement

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
    const combobox = comboboxContext.get(this.host)
    document.body.appendChild(this.host)
    if (!combobox) {
      console.warn('[ui-combobox-content] No parent <ui-combobox> found')
      return
    }
    const updateEmpty = () => {
      this.emptyEl.hidden = combobox.hasResults
    }
    updateEmpty()
    this.disposers = [
      bindPart(combobox, this.positionerEl, (api) => api.getPositionerProps()),
      bindPart(combobox, this.contentEl, (api) => api.getContentProps()),
      combobox.subscribe(updateEmpty),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M20 6 9 17l-5-5"></path></svg>`

const ITEM_TEMPLATE = `
<span data-slot="combobox-item-text"><au-slot></au-slot></span>
<span class="absolute right-2 flex size-3.5 items-center justify-center">
  <span ref="indicatorEl" data-slot="combobox-item-indicator">${CHECK_ICON}</span>
</span>
`

@customElement({ name: 'ui-combobox-item', template: ITEM_TEMPLATE })
export class UiComboboxItem {
  @bindable() value = ''
  @bindable() disabled = false
  @bindable() label = ''

  indicatorEl!: HTMLSpanElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private itemData: ComboboxItemData | null = null
  private unregister: (() => void) | null = null
  private disposers: Array<() => void> = []

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'combobox-item')
    this.host.className = cn(
      'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      author,
    )
  }

  attached(): void {
    const combobox = comboboxContext.get(this.host)
    if (!combobox) {
      console.warn('[ui-combobox-item] No parent <ui-combobox> found')
      return
    }
    this.itemData = {
      value: this.value,
      label: this.label || this.host.textContent?.trim() || this.value,
      disabled: this.disabled,
    }
    this.unregister = combobox.registerItem(this.itemData)
    const updateVisibility = () => {
      this.host.hidden = !combobox.isItemVisible(this.itemData!.value)
    }
    updateVisibility()
    this.disposers = [
      bindPart(combobox, this.host, (api) => api.getItemProps({ item: this.itemData! })),
      bindPart(combobox, this.indicatorEl, (api) =>
        api.getItemIndicatorProps({ item: this.itemData! }),
      ),
      combobox.subscribe(updateVisibility),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    this.unregister?.()
    this.unregister = null
  }
}
