/**
 * ui-radio-group / ui-radio-group-item — radio-group behavior behind the primitives facade.
 *   <ui-radio-group value.two-way="plan">
 *     <ui-radio-group-item value="free">Free</ui-radio-group-item>
 *   </ui-radio-group>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createRadioGroupBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type RadioGroupApi,
  type BehaviorSource,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export const radioGroupContext = createContext<UiRadioGroup>()

@customElement({ name: 'ui-radio-group', template: '<au-slot></au-slot>' })
export class UiRadioGroup implements BehaviorSource<RadioGroupApi> {
  @bindable({ mode: BindingMode.twoWay }) value = ''
  @bindable() disabled = false
  @bindable() name = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createRadioGroupBehavior()
  private sync: ControlledSync<string> | null = null
  private disposeRoot: (() => void) | null = null

  get api(): RadioGroupApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    radioGroupContext.set(this.host, this)
    this.sync = createControlledSync<string>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.behavior.api?.setValue(v),
      setBindable: (v) => (this.value = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('radio-group'),
      defaultValue: this.value || null,
      disabled: this.disabled,
      name: this.name || undefined,
      onValueChange: (d: { value: string | null }) => this.sync?.fromMachine(d.value ?? ''),
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'radio-group')
    this.host.className = cn('grid gap-3', author)
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
    radioGroupContext.delete(this.host)
  }
}

const ITEM_TEMPLATE = `
<label ref="itemEl" class="flex items-center gap-2 text-sm leading-none font-medium select-none">
  <input ref="inputEl">
  <span ref="controlEl" data-slot="radio-group-item" class.bind="controlClasses">
    <span data-indicator class="hidden size-full items-center justify-center group-data-[state=checked]/radio:flex">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-2 fill-primary">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    </span>
  </span>
  <au-slot></au-slot>
</label>
`

@customElement({ name: 'ui-radio-group-item', template: ITEM_TEMPLATE })
export class UiRadioGroupItem {
  @bindable() value = ''
  @bindable() disabled = false

  itemEl!: HTMLLabelElement
  inputEl!: HTMLInputElement
  controlEl!: HTMLSpanElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private group: UiRadioGroup | null = null
  private disposers: Array<() => void> = []
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get controlClasses(): string {
    return cn(
      'group/radio border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px]',
      this.authorClasses,
    )
  }

  attached(): void {
    this.group = radioGroupContext.get(this.host) ?? null
    if (!this.group) {
      console.warn('[ui-radio-group-item] No parent <ui-radio-group> found')
      return
    }
    const itemProps = { value: this.value, disabled: this.disabled || undefined }
    this.disposers = [
      bindPart(this.group, this.itemEl, (api) => api.getItemProps(itemProps)),
      bindPart(this.group, this.inputEl, (api) => api.getItemHiddenInputProps(itemProps)),
      bindPart(this.group, this.controlEl, (api) => api.getItemControlProps(itemProps)),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}
