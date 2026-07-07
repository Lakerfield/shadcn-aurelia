/**
 * ui-calendar — Zag date-picker in inline mode (a month grid).
 *
 * Also the shared grid for ui-date-picker: when an ancestor provides
 * `datePickerContext` (the popover variant), the calendar renders against
 * that machine instead of creating its own.
 *
 *   <ui-calendar value.two-way="date"></ui-calendar>   (ISO string, e.g. '2026-07-06')
 *
 * Day cells are native <td>/<div> elements (HTML parser requirement inside
 * <table>), wired to Zag via the ui-calendar-cell / ui-calendar-day custom
 * ATTRIBUTES (convention C).
 */
import { customAttribute, customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createDatePickerBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  parseDate,
  resolveDirection,
  type ControlledSync,
  type DatePickerApi,
  type DateValue,
  type BehaviorSource,
  type Context,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export interface DatePickerOwner extends BehaviorSource<DatePickerApi> {
  /** Batched notify — cells re-read their day value after repeat updates. */
  requestNotify(): void
}

export const datePickerContext: Context<DatePickerOwner> = createContext<DatePickerOwner>()

interface WeekDayLabel {
  narrow: string
  long: string
}

/** Applies Zag's day-cell props to a native <td> (HTML parser forbids custom elements there). */
@customAttribute('ui-calendar-cell')
export class UiCalendarCellAttribute {
  @bindable() value: DateValue | null = null

  private readonly el: HTMLElement = resolve(INode) as HTMLElement
  private owner: DatePickerOwner | null = null
  private dispose: (() => void) | null = null

  attached(): void {
    this.owner = datePickerContext.get(this.el) ?? null
    if (!this.owner) return
    this.dispose = bindPart(this.owner, this.el, (api) =>
      this.value ? api.getDayTableCellProps({ value: this.value }) : null,
    )
  }

  valueChanged(): void {
    // Repeat recycles cells with new day values; re-read props next microtask.
    this.owner?.requestNotify()
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

/** Applies Zag's day-trigger props to the inner day element. */
@customAttribute('ui-calendar-day')
export class UiCalendarDayAttribute {
  @bindable() value: DateValue | null = null

  private readonly el: HTMLElement = resolve(INode) as HTMLElement
  private owner: DatePickerOwner | null = null
  private dispose: (() => void) | null = null

  attached(): void {
    this.owner = datePickerContext.get(this.el) ?? null
    if (!this.owner) return
    this.dispose = bindPart(this.owner, this.el, (api) =>
      this.value ? api.getDayTableCellTriggerProps({ value: this.value }) : null,
    )
  }

  valueChanged(): void {
    this.owner?.requestNotify()
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}
const CHEVRON_LEFT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="m15 18-6-6 6-6"></path></svg>`
const CHEVRON_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="m9 18 6-6-6-6"></path></svg>`

const NAV_BUTTON_CLASSES =
  'inline-flex size-7 items-center justify-center rounded-md border bg-transparent p-0 opacity-50 transition-opacity hover:opacity-100 disabled:pointer-events-none disabled:opacity-25'

const DAY_CLASSES =
  'inline-flex size-8 cursor-default items-center justify-center rounded-md text-sm font-normal select-none transition-colors hover:bg-accent hover:text-accent-foreground data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[today]:bg-accent data-[today]:text-accent-foreground data-[today]:data-[selected]:bg-primary data-[outside-range]:text-muted-foreground data-[outside-range]:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[unavailable]:line-through data-[focused]:ring-ring/50 data-[focused]:ring-[3px] outline-none'

const CALENDAR_TEMPLATE = `
<div ref="controlEl" data-slot="calendar-view-control" class="relative flex w-full items-center justify-between pt-1">
  <button ref="prevEl" type="button" data-slot="calendar-prev" class="${NAV_BUTTON_CLASSES}">${CHEVRON_LEFT}</button>
  <div ref="headingEl" data-slot="calendar-heading" class="text-sm font-medium" aria-live="polite">\${heading}</div>
  <button ref="nextEl" type="button" data-slot="calendar-next" class="${NAV_BUTTON_CLASSES}">${CHEVRON_RIGHT}</button>
</div>
<table ref="tableEl" data-slot="calendar-table" class="mt-4 w-full border-collapse">
  <thead>
    <tr>
      <th repeat.for="wd of weekDays" scope="col" abbr.bind="wd.long"
          class="text-muted-foreground w-8 rounded-md text-[0.8rem] font-normal">\${wd.narrow}</th>
    </tr>
  </thead>
  <tbody ref="tbodyEl">
    <tr repeat.for="week of weeks">
      <td repeat.for="day of week" ui-calendar-cell.bind="day" class="p-0 text-center text-sm">
        <div ui-calendar-day.bind="day" class="${DAY_CLASSES}">\${day.day}</div>
      </td>
    </tr>
  </tbody>
</table>
`

@customElement({
  name: 'ui-calendar',
  template: CALENDAR_TEMPLATE,
  dependencies: [UiCalendarCellAttribute, UiCalendarDayAttribute],
})
export class UiCalendar implements DatePickerOwner {
  /** Selected date as ISO string (yyyy-mm-dd). Ignored when nested in ui-date-picker. */
  @bindable({ mode: BindingMode.twoWay }) value = ''

  controlEl!: HTMLDivElement
  headingEl!: HTMLDivElement
  prevEl!: HTMLButtonElement
  nextEl!: HTMLButtonElement
  tableEl!: HTMLTableElement

  heading = ''
  weeks: DateValue[][] = []
  weekDays: WeekDayLabel[] = []

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private ownBehavior: ReturnType<typeof createDatePickerBehavior> | null = null
  private owner: DatePickerOwner | null = null
  private sync: ControlledSync<string> | null = null
  private disposers: Array<() => void> = []
  private notifyQueued = false

  get api(): DatePickerApi | null {
    return this.owner === this ? (this.ownBehavior?.api ?? null) : (this.owner?.api ?? null)
  }

  subscribe(listener: () => void): () => void {
    if (this.owner && this.owner !== this) return this.owner.subscribe(listener)
    return this.ownBehavior?.subscribe(listener) ?? (() => () => {})()
  }

  requestNotify(): void {
    if (this.owner && this.owner !== this) {
      this.owner.requestNotify()
      return
    }
    if (this.notifyQueued) return
    this.notifyQueued = true
    queueMicrotask(() => {
      this.notifyQueued = false
      this.ownBehavior?.notify()
    })
  }

  binding(): void {
    // Nested in a ui-date-picker? Render against its machine. Re-publish the
    // context on our own host: day cells render AFTER the popover content
    // portals to <body>, so a lookup walking past this host would find nothing.
    const external = this.host.parentElement
      ? datePickerContext.get(this.host.parentElement)
      : undefined
    if (external) {
      this.owner = external
      datePickerContext.set(this.host, external)
      return
    }
    this.owner = this
    datePickerContext.set(this.host, this)
    this.ownBehavior = createDatePickerBehavior()
    this.sync = createControlledSync<string>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.ownBehavior?.api?.setValue(v ? [parseDate(v)] : []),
      setBindable: (v) => (this.value = v),
    })
    this.ownBehavior.init({
      dir: resolveDirection(this.host),
      id: createId('calendar'),
      inline: true,
      open: true,
      defaultValue: this.value ? [parseDate(this.value)] : [],
      // d.value[0].toString() is ISO (yyyy-mm-dd); valueAsString is locale-formatted
      onValueChange: (d: { value: DateValue[] }) =>
        this.sync?.fromMachine(d.value[0]?.toString() ?? ''),
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'calendar')
    this.host.className = cn('inline-block p-3', author)
  }

  attached(): void {
    this.ownBehavior?.start()
    const source = this.owner === this ? this.ownBehavior! : this.owner!
    const syncGrid = () => {
      const api = source.api
      if (!api) return
      this.heading = api.visibleRangeText.start
      this.weeks = api.weeks
      this.weekDays = api.weekDays.map((wd) => ({ narrow: wd.narrow, long: wd.long }))
    }
    syncGrid()
    this.disposers = [
      source.subscribe(syncGrid),
      bindPart(source, this.controlEl, (api) => api.getViewControlProps()),
      bindPart(source, this.prevEl, (api) => api.getPrevTriggerProps()),
      bindPart(source, this.nextEl, (api) => api.getNextTriggerProps()),
      bindPart(source, this.headingEl, (api) => api.getRangeTextProps()),
      bindPart(source, this.tableEl, (api) => api.getTableProps()),
    ]
  }

  valueChanged(v: string): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    this.ownBehavior?.stop()
    datePickerContext.delete(this.host)
  }
}
