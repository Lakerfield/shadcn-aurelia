/**
 * ui-date-picker — Zag date-picker in popover mode. The content nests a
 * <ui-calendar>, which renders against this machine via datePickerContext.
 *
 *   <ui-date-picker value.two-way="date" placeholder="Pick a date">
 *     <ui-date-picker-trigger class="w-[240px]"></ui-date-picker-trigger>
 *     <ui-date-picker-content>
 *       <ui-calendar></ui-calendar>
 *     </ui-date-picker-content>
 *   </ui-date-picker>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createDatePickerBehavior,
  createControlledSync,
  createId,
  bindPart,
  parseDate,
  resolveDirection,
  type ControlledSync,
  type DatePickerApi,
  type DateValue,
} from '@shadcn-aurelia/primitives'
import { datePickerContext, type DatePickerOwner } from '@/registry/default/ui/calendar'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-date-picker', template: '<au-slot></au-slot>' })
export class UiDatePicker implements DatePickerOwner {
  /** Selected date as ISO string (yyyy-mm-dd). */
  @bindable({ mode: BindingMode.twoWay }) value = ''
  @bindable() placeholder = 'Pick a date'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createDatePickerBehavior()
  private sync: ControlledSync<string> | null = null
  private notifyQueued = false

  get api(): DatePickerApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  requestNotify(): void {
    if (this.notifyQueued) return
    this.notifyQueued = true
    queueMicrotask(() => {
      this.notifyQueued = false
      this.behavior.notify()
    })
  }

  binding(): void {
    datePickerContext.set(this.host, this)
    this.sync = createControlledSync<string>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.behavior.api?.setValue(v ? [parseDate(v)] : []),
      setBindable: (v) => (this.value = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('date-picker'),
      defaultValue: this.value ? [parseDate(this.value)] : [],
      positioning: { placement: 'bottom-start', gutter: 4 },
      // d.value[0].toString() is ISO (yyyy-mm-dd); valueAsString is locale-formatted
      onValueChange: (d: { value: DateValue[] }) =>
        this.sync?.fromMachine(d.value[0]?.toString() ?? ''),
    })
  }

  attached(): void {
    this.behavior.start()
  }

  valueChanged(v: string): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.behavior.stop()
    datePickerContext.delete(this.host)
  }
}

const CALENDAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>`

const TRIGGER_TEMPLATE = `
<div ref="controlEl" data-slot="date-picker-control" class="inline-flex w-fit">
  <button ref="btn" type="button" class.bind="classes" data-slot="date-picker-trigger">
    ${CALENDAR_ICON}
    <span ref="valueEl" data-slot="date-picker-value"></span>
  </button>
</div>
`

@customElement({ name: 'ui-date-picker-trigger', template: TRIGGER_TEMPLATE })
export class UiDatePickerTrigger {
  controlEl!: HTMLDivElement
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
      "border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex h-9 w-fit items-center justify-start gap-2 rounded-md border bg-transparent px-3 py-2 text-sm font-normal whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      this.authorClasses,
    )
  }

  attached(): void {
    const picker = datePickerContext.get(this.host)
    if (!picker) {
      console.warn('[ui-date-picker-trigger] No parent <ui-date-picker> found')
      return
    }
    const placeholder = (picker as UiDatePicker).placeholder ?? 'Pick a date'
    const updateText = () => {
      const text = picker.api?.valueAsString[0] ?? ''
      this.valueEl.textContent = text || placeholder
      this.valueEl.classList.toggle('text-muted-foreground', !text)
    }
    updateText()
    const valueId = createId('date-picker-value')
    this.valueEl.id = valueId
    this.disposers = [
      // The control wrapper is the positioning anchor for the popover.
      bindPart(picker, this.controlEl, (api) => api.getControlProps()),
      bindPart(picker, this.btn, (api) => ({
        ...api.getTriggerProps(),
        'aria-labelledby': valueId,
      })),
      picker.subscribe(updateText),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="date-picker-positioner">
  <div ref="contentEl" data-slot="date-picker-content" class.bind="classes">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-date-picker-content', template: CONTENT_TEMPLATE })
export class UiDatePickerContent {
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
      'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 origin-(--transform-origin) rounded-md border shadow-md outline-hidden',
      this.authorClasses,
    )
  }

  attached(): void {
    const picker = datePickerContext.get(this.host)
    document.body.appendChild(this.host)
    if (!picker) {
      console.warn('[ui-date-picker-content] No parent <ui-date-picker> found')
      return
    }
    this.disposers = [
      bindPart(picker, this.positionerEl, (api) => api.getPositionerProps()),
      bindPart(picker, this.contentEl, (api) => api.getContentProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}
