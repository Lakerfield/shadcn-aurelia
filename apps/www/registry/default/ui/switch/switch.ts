/**
 * ui-switch — switch behavior behind the primitives facade.
 *   <ui-switch checked.two-way="airplane" checked-change.trigger="...">Label</ui-switch>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createSwitchBehavior,
  createControlledSync,
  createId,
  bindPart,
  type ControlledSync,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

const TEMPLATE = `
<label ref="rootEl" class="inline-flex items-center gap-2 text-sm leading-none font-medium select-none">
  <input ref="inputEl">
  <span ref="controlEl" data-slot="switch" class.bind="controlClasses">
    <span ref="thumbEl" data-slot="switch-thumb"
          class="bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"></span>
  </span>
  <au-slot></au-slot>
</label>
`

@customElement({ name: 'ui-switch', template: TEMPLATE })
export class UiSwitch {
  @bindable({ mode: BindingMode.twoWay }) checked = false
  @bindable() disabled = false
  @bindable() name = ''

  rootEl!: HTMLLabelElement
  inputEl!: HTMLInputElement
  controlEl!: HTMLSpanElement
  thumbEl!: HTMLSpanElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createSwitchBehavior()
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
      id: createId('switch'),
      defaultChecked: this.checked,
      disabled: this.disabled,
      name: this.name || undefined,
      onCheckedChange: (d: { checked: boolean }) => this.sync?.fromMachine(d.checked),
    })
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get controlClasses(): string {
    return cn(
      'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
      this.authorClasses,
    )
  }

  attached(): void {
    this.behavior.start()
    this.disposers = [
      bindPart(this.behavior, this.rootEl, (api) => api.getRootProps()),
      bindPart(this.behavior, this.inputEl, (api) => api.getHiddenInputProps()),
      bindPart(this.behavior, this.controlEl, (api) => api.getControlProps()),
      bindPart(this.behavior, this.thumbEl, (api) => api.getThumbProps()),
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
