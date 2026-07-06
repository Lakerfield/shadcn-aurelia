/**
 * ui-input-otp — Zag pin-input behind the facade. Renders `count` one-char
 * inputs, visually grouped per `group-size` (0 = one continuous row).
 *   <ui-input-otp count="6" group-size="3" value.two-way="code"></ui-input-otp>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createPinInputBehavior,
  createControlledSync,
  createId,
  bindPart,
  type ControlledSync,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

const SLOT_CLASSES =
  'border-input dark:bg-input/30 relative flex size-9 items-center justify-center border-y border-r text-center text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md focus:z-10 focus:border-ring focus:ring-ring/50 focus:ring-[3px] aria-invalid:border-destructive'

@customElement({ name: 'ui-input-otp', template: '' })
export class UiInputOtp {
  @bindable({ mode: BindingMode.twoWay }) value = ''
  @bindable() count = 6
  @bindable({ attribute: 'group-size' }) groupSize = 0
  @bindable() disabled = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createPinInputBehavior()
  private sync: ControlledSync<string> | null = null
  private disposers: Array<() => void> = []

  binding(): void {
    this.sync = createControlledSync<string>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.behavior.api?.setValue(v.split('')),
      setBindable: (v) => (this.value = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('input-otp'),
      defaultValue: this.value ? this.value.split('') : undefined,
      count: Number(this.count),
      otp: true,
      disabled: this.disabled,
      onValueChange: (d: { valueAsString: string }) => this.sync?.fromMachine(d.valueAsString),
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'input-otp')
    this.host.className = cn('flex items-center gap-2 has-disabled:opacity-50', author)
  }

  attached(): void {
    this.behavior.start()
    this.disposers = [bindPart(this.behavior, this.host, (api) => api.getRootProps())]

    const count = Number(this.count)
    const size = Number(this.groupSize) || count
    let group: HTMLDivElement | null = null

    for (let index = 0; index < count; index++) {
      if (index % size === 0) {
        if (group && this.groupSize) {
          const sep = document.createElement('div')
          sep.dataset.slot = 'input-otp-separator'
          sep.setAttribute('role', 'separator')
          sep.className = 'text-muted-foreground'
          sep.textContent = '-'
          this.host.appendChild(sep)
        }
        group = document.createElement('div')
        group.dataset.slot = 'input-otp-group'
        group.className = 'flex items-center'
        this.host.appendChild(group)
      }
      const input = document.createElement('input')
      input.className = SLOT_CLASSES
      group!.appendChild(input)
      this.disposers.push(bindPart(this.behavior, input, (api) => api.getInputProps({ index })))
    }
  }

  valueChanged(v: string): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    this.behavior.stop()
  }
}
