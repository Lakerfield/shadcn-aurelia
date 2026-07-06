/**
 * ui-toggle-group — Zag toggle-group (roving focus, single/multiple selection).
 * Items inherit variant/size from the root, matching shadcn's context pattern.
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createToggleGroupBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type ToggleGroupApi,
  type BehaviorSource,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'
import { toggleVariants, type ToggleVariants } from '@/registry/default/ui/toggle'

export const toggleGroupContext = createContext<UiToggleGroup>()

@customElement({ name: 'ui-toggle-group', template: '<au-slot></au-slot>' })
export class UiToggleGroup implements BehaviorSource<ToggleGroupApi> {
  /** Selected values (array; single-item array when type="single"). */
  @bindable({ mode: BindingMode.twoWay }) value: string[] = []
  @bindable() type: 'single' | 'multiple' = 'single'
  @bindable() variant: ToggleVariants['variant'] = 'default'
  @bindable() size: ToggleVariants['size'] = 'default'
  @bindable() disabled = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createToggleGroupBehavior()
  private sync: ControlledSync<string[]> | null = null
  private disposeRoot: (() => void) | null = null

  get api(): ToggleGroupApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    toggleGroupContext.set(this.host, this)
    this.sync = createControlledSync<string[]>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.behavior.api?.setValue(v),
      setBindable: (v) => (this.value = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('toggle-group'),
      defaultValue: this.value,
      multiple: this.type === 'multiple',
      disabled: this.disabled,
      onValueChange: (d: { value: string[] }) => this.sync?.fromMachine(d.value),
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'toggle-group')
    this.host.setAttribute('data-variant', this.variant ?? 'default')
    this.host.setAttribute('data-size', this.size ?? 'default')
    this.host.className = cn(
      'group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs',
      author,
    )
  }

  attached(): void {
    this.behavior.start()
    this.disposeRoot = bindPart(this.behavior, this.host, (api) => api.getRootProps())
  }

  valueChanged(v: string[]): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.disposeRoot?.()
    this.behavior.stop()
    toggleGroupContext.delete(this.host)
  }
}

const ITEM_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="toggle-group-item">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-toggle-group-item', template: ITEM_TEMPLATE })
export class UiToggleGroupItem {
  @bindable() value = ''

  btn!: HTMLButtonElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private group: UiToggleGroup | null = null
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
      toggleVariants({
        variant: this.group?.variant ?? 'default',
        size: this.group?.size ?? 'default',
      }),
      'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10',
      this.group?.variant === 'outline' && 'border-l-0 first:border-l',
      this.authorClasses,
    )
  }

  attached(): void {
    this.group = toggleGroupContext.get(this.host) ?? null
    if (!this.group) {
      console.warn('[ui-toggle-group-item] No parent <ui-toggle-group> found')
      return
    }
    this.dispose = bindPart(this.group, this.btn, (api) => api.getItemProps({ value: this.value }))
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}
