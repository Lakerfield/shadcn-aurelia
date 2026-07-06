/**
 * ui-tabs family — Zag tabs behind the facade (roving focus, arrow keys).
 *   <ui-tabs value.two-way="tab">
 *     <ui-tabs-list><ui-tabs-trigger value="a">A</ui-tabs-trigger>…</ui-tabs-list>
 *     <ui-tabs-content value="a">…</ui-tabs-content>
 *   </ui-tabs>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createTabsBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type TabsApi,
  type BehaviorSource,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export const tabsContext = createContext<UiTabs>()

@customElement({ name: 'ui-tabs', template: '<au-slot></au-slot>' })
export class UiTabs implements BehaviorSource<TabsApi> {
  @bindable({ mode: BindingMode.twoWay }) value = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createTabsBehavior()
  private sync: ControlledSync<string> | null = null
  private disposeRoot: (() => void) | null = null

  get api(): TabsApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    tabsContext.set(this.host, this)
    this.sync = createControlledSync<string>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.behavior.api?.setValue(v),
      setBindable: (v) => (this.value = v),
    })
    this.behavior.init({
      id: createId('tabs'),
      defaultValue: this.value || undefined,
      onValueChange: (d: { value: string }) => this.sync?.fromMachine(d.value),
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'tabs')
    this.host.className = cn('flex flex-col gap-2', author)
  }

  attached(): void {
    this.behavior.start()
    this.disposeRoot = bindPart(this.behavior, this.host, (api) => api.getRootProps())
  }

  valueChanged(v: string): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.disposeRoot?.()
    this.behavior.stop()
    tabsContext.delete(this.host)
  }
}

@customElement({ name: 'ui-tabs-list', template: '<au-slot></au-slot>' })
export class UiTabsList {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'tabs-list')
    this.host.className = cn(
      'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
      author,
    )
  }

  attached(): void {
    const tabs = tabsContext.get(this.host)
    if (tabs) this.dispose = bindPart(tabs, this.host, (api) => api.getListProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const TRIGGER_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="tabs-trigger">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-tabs-trigger', template: TRIGGER_TEMPLATE })
export class UiTabsTrigger {
  @bindable() value = ''
  @bindable() disabled = false

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
    return cn(
      "data-[selected]:bg-background dark:data-[selected]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[selected]:border-input dark:data-[selected]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[selected]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      this.authorClasses,
    )
  }

  attached(): void {
    const tabs = tabsContext.get(this.host)
    if (!tabs) {
      console.warn('[ui-tabs-trigger] No parent <ui-tabs> found')
      return
    }
    this.dispose = bindPart(tabs, this.btn, (api) =>
      api.getTriggerProps({ value: this.value, disabled: this.disabled || undefined }),
    )
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

@customElement({ name: 'ui-tabs-content', template: '<au-slot></au-slot>' })
export class UiTabsContent {
  @bindable() value = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'tabs-content')
    this.host.className = cn('block flex-1 outline-none', author)
  }

  attached(): void {
    const tabs = tabsContext.get(this.host)
    if (tabs) this.dispose = bindPart(tabs, this.host, (api) => api.getContentProps({ value: this.value }))
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}
