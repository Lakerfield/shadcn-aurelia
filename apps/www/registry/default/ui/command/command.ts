/**
 * ui-command family — cmdk-style command palette on the Zag combobox machine
 * with a permanently-open inline listbox.
 *
 * Selection (pointer or Enter) dispatches a bubbling 'select' CustomEvent from
 * the matching ui-command-item, so `select.trigger` works per item.
 *
 *   <ui-command>
 *     <ui-command-input placeholder="Type a command…"></ui-command-input>
 *     <ui-command-list>
 *       <ui-command-empty>No results found.</ui-command-empty>
 *       <ui-command-group heading="Suggestions">
 *         <ui-command-item value="calendar" select.trigger="…">Calendar</ui-command-item>
 *       </ui-command-group>
 *     </ui-command-list>
 *   </ui-command>
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import {
  createComboboxBehavior,
  createListCollection,
  createContext,
  createId,
  bindPart,
  type ComboboxApi,
  type BehaviorSource,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export interface CommandItemData {
  value: string
  label: string
  disabled?: boolean
  element: HTMLElement
}

export interface CommandOwner extends BehaviorSource<ComboboxApi> {
  registerItem(item: CommandItemData): () => void
  isItemVisible(value: string): boolean
  readonly hasResults: boolean
}

export const commandContext = createContext<CommandOwner>()

@customElement({ name: 'ui-command', template: '<au-slot></au-slot>' })
export class UiCommand implements CommandOwner {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createComboboxBehavior()
  private readonly items: CommandItemData[] = []
  private visibleValues: Set<string> | null = null
  private started = false

  get api(): ComboboxApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  registerItem(item: CommandItemData): () => void {
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

  private buildCollection() {
    const items = this.visibleValues === null
      ? [...this.items]
      : this.items.filter((i) => this.visibleValues!.has(i.value))
    return createListCollection({
      items: items.map(({ value, label, disabled }) => ({ value, label, disabled })),
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
    this.visibleValues = q === '' ? null : new Set(
      this.items.filter((i) => i.label.toLowerCase().includes(q)).map((i) => i.value),
    )
    this.refreshCollection()
  }

  binding(): void {
    commandContext.set(this.host, this)
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'command')
    this.host.className = cn(
      'bg-popover text-popover-foreground flex size-full flex-col overflow-hidden rounded-md',
      author,
    )
  }

  attached(): void {
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('command'),
      collection: this.buildCollection(),
      // Palette semantics: list always visible, first match highlighted,
      // selection triggers an action instead of filling the input.
      open: true,
      inputBehavior: 'autohighlight',
      selectionBehavior: 'clear',
      disableLayer: true,
      onValueChange: (d: { value: string[] }) => {
        const value = d.value[0]
        if (!value) return
        const item = this.items.find((i) => i.value === value)
        item?.element.dispatchEvent(new CustomEvent('select', { detail: { value }, bubbles: true }))
      },
      onInputValueChange: (d: { inputValue: string }) => this.applyFilter(d.inputValue),
    })
    this.behavior.start()
    this.started = true
  }

  detaching(): void {
    this.started = false
    this.behavior.stop()
    commandContext.delete(this.host)
  }
}

const SEARCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0 opacity-50"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>`

const INPUT_TEMPLATE = `
<div data-slot="command-input-wrapper" class="flex h-9 items-center gap-2 border-b px-3">
  ${SEARCH_ICON}
  <input ref="inputEl" data-slot="command-input" placeholder.bind="placeholder"
         class="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50" />
</div>
`

@customElement({ name: 'ui-command-input', template: INPUT_TEMPLATE })
export class UiCommandInput {
  @bindable() placeholder = 'Type a command or search…'

  inputEl!: HTMLInputElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  created(): void {
    this.host.style.display = 'contents'
  }

  attached(): void {
    const command = commandContext.get(this.host)
    if (!command) {
      console.warn('[ui-command-input] No parent <ui-command> found')
      return
    }
    this.dispose = bindPart(command, this.inputEl, (api) => api.getInputProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

@customElement({ name: 'ui-command-list', template: '<au-slot></au-slot>' })
export class UiCommandList {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'command-list')
    this.host.className = cn(
      'block max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto p-1',
      author,
    )
  }

  attached(): void {
    const command = commandContext.get(this.host)
    if (!command) return
    this.dispose = bindPart(command, this.host, (api) => api.getContentProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

@customElement({ name: 'ui-command-empty', template: '<au-slot></au-slot>' })
export class UiCommandEmpty {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'command-empty')
    this.host.className = cn('block py-6 text-center text-sm', author)
  }

  attached(): void {
    const command = commandContext.get(this.host)
    if (!command) return
    const update = () => {
      this.host.hidden = command.hasResults
    }
    update()
    this.dispose = command.subscribe(update)
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const GROUP_TEMPLATE = `
<div if.bind="heading" data-slot="command-group-heading" class="text-muted-foreground px-2 py-1.5 text-xs font-medium">\${heading}</div>
<au-slot></au-slot>
`

@customElement({ name: 'ui-command-group', template: GROUP_TEMPLATE })
export class UiCommandGroup {
  @bindable() heading = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly groupId = createId('command-group')
  private disposers: Array<() => void> = []

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'command-group')
    this.host.className = cn('text-foreground block overflow-hidden', author)
  }

  attached(): void {
    const command = commandContext.get(this.host)
    if (!command) return
    const updateVisibility = () => {
      // Hide the whole group (incl. heading) when every item is filtered out.
      const anyVisible = this.host.querySelector('[data-slot="command-item"]:not([hidden])')
      this.host.hidden = !anyVisible
    }
    updateVisibility()
    this.disposers = [
      bindPart(command, this.host, (api) => api.getItemGroupProps({ id: this.groupId })),
      command.subscribe(updateVisibility),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}

@customElement({ name: 'ui-command-item', template: '<au-slot></au-slot>' })
export class UiCommandItem {
  @bindable() value = ''
  @bindable() disabled = false
  @bindable() label = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private itemData: CommandItemData | null = null
  private unregister: (() => void) | null = null
  private disposers: Array<() => void> = []

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'command-item')
    this.host.className = cn(
      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      author,
    )
  }

  attached(): void {
    const command = commandContext.get(this.host)
    if (!command) {
      console.warn('[ui-command-item] No parent <ui-command> found')
      return
    }
    if (!this.value) this.value = createId('command-item')
    this.itemData = {
      value: this.value,
      label: this.label || this.host.textContent?.trim() || this.value,
      disabled: this.disabled,
      element: this.host,
    }
    this.unregister = command.registerItem(this.itemData)
    const updateVisibility = () => {
      this.host.hidden = !command.isItemVisible(this.itemData!.value)
    }
    updateVisibility()
    this.disposers = [
      // pass `disabled` along — getItemDisabled reads the item object handed
      // to getItemProps, not the collection entry
      bindPart(command, this.host, (api) =>
        api.getItemProps({
          item: {
            value: this.itemData!.value,
            label: this.itemData!.label,
            disabled: this.itemData!.disabled,
          },
        }),
      ),
      command.subscribe(updateVisibility),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    this.unregister?.()
    this.unregister = null
  }
}

@customElement({ name: 'ui-command-separator', template: '' })
export class UiCommandSeparator {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'command-separator')
    this.host.setAttribute('aria-hidden', 'true')
    this.host.className = cn('bg-border -mx-1 block h-px', author)
  }
}

@customElement({ name: 'ui-command-shortcut', template: '<au-slot></au-slot>' })
export class UiCommandShortcut {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'command-shortcut')
    this.host.className = cn('text-muted-foreground ml-auto text-xs tracking-widest', author)
  }
}
