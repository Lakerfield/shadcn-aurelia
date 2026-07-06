/**
 * ui-checkbox — Zag checkbox behind the primitives facade.
 *   <ui-checkbox checked.two-way="agreed">Accept terms</ui-checkbox>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createCheckboxBehavior,
  createControlledSync,
  createId,
  bindPart,
  type ControlledSync,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

const TEMPLATE = `
<label ref="rootEl" class="flex items-center gap-2 text-sm leading-none font-medium select-none">
  <input ref="inputEl">
  <span ref="controlEl" data-slot="checkbox" class.bind="controlClasses">
    <span ref="indicatorEl" data-slot="checkbox-indicator" class="flex items-center justify-center text-current">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5">
        <path d="M20 6 9 17l-5-5"></path>
      </svg>
    </span>
  </span>
  <au-slot></au-slot>
</label>
`

@customElement({ name: 'ui-checkbox', template: TEMPLATE })
export class UiCheckbox {
  @bindable({ mode: BindingMode.twoWay }) checked = false
  @bindable() disabled = false
  @bindable() invalid = false
  @bindable() name = ''

  rootEl!: HTMLLabelElement
  inputEl!: HTMLInputElement
  controlEl!: HTMLSpanElement
  indicatorEl!: HTMLSpanElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createCheckboxBehavior()
  private sync: ControlledSync<boolean> | null = null
  private disposers: Array<() => void> = []
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  binding(): void {
    this.sync = createControlledSync<boolean>({
      host: this.host,
      eventName: 'checked-change',
      setMachineValue: (v) => this.behavior.api?.setChecked(v),
      setBindable: (v) => (this.checked = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('checkbox'),
      defaultChecked: this.checked,
      disabled: this.disabled,
      invalid: this.invalid,
      name: this.name || undefined,
      onCheckedChange: (d: { checked: boolean | 'indeterminate' }) =>
        this.sync?.fromMachine(d.checked === true),
    })
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get controlClasses(): string {
    return cn(
      'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
      this.authorClasses,
    )
  }

  attached(): void {
    this.behavior.start()
    this.disposers = [
      bindPart(this.behavior, this.rootEl, (api) => api.getRootProps()),
      bindPart(this.behavior, this.inputEl, (api) => api.getHiddenInputProps()),
      bindPart(this.behavior, this.controlEl, (api) => api.getControlProps()),
      bindPart(this.behavior, this.indicatorEl, (api) => api.getIndicatorProps()),
    ]
  }

  checkedChanged(v: boolean): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    this.behavior.stop()
  }
}
