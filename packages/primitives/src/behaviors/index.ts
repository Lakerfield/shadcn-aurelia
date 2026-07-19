/**
 * Behavior facades — one factory per interactive behavior. Engine v1 is Zag;
 * Phase 8 swaps these for native implementations behind the same signatures
 * (tooltip is native as of 0.2 — see `../native/`).
 */
import type { CollectionItem, CollectionOptions, ListCollection } from '@zag-js/collection'
import * as accordion from '@zag-js/accordion'
import * as checkbox from '@zag-js/checkbox'
import * as datePicker from '@zag-js/date-picker'
import * as toast from '@zag-js/toast'
import * as collapsible from '@zag-js/collapsible'
import * as combobox from '@zag-js/combobox'
import * as dialog from '@zag-js/dialog'
import * as hoverCard from '@zag-js/hover-card'
import * as menu from '@zag-js/menu'
import * as navigationMenu from '@zag-js/navigation-menu'
import * as popover from '@zag-js/popover'
import * as select from '@zag-js/select'
import * as tooltip from '@zag-js/tooltip'
import * as pinInput from '@zag-js/pin-input'
import * as progress from '@zag-js/progress'
import * as radioGroup from '@zag-js/radio-group'
import * as slider from '@zag-js/slider'
import * as switchNs from '@zag-js/switch'
import * as tabs from '@zag-js/tabs'
import * as toggleGroup from '@zag-js/toggle-group'
import { ZagBehavior, type BehaviorSource } from '../adapter/zag-behavior'
import { NativeTooltipBehavior, type TooltipApi, type TooltipProps } from '../native/tooltip'
import {
  NativeAccordionBehavior,
  type AccordionApi,
  type AccordionProps,
} from '../native/accordion'
import {
  NativeCollapsibleBehavior,
  type CollapsibleApi,
  type CollapsibleProps,
} from '../native/collapsible'
import { NativeTabsBehavior, type TabsApi, type TabsProps } from '../native/tabs'

/**
 * Accordion — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { AccordionApi, AccordionProps }
export interface AccordionBehavior extends BehaviorSource<AccordionApi> {
  init(props: AccordionProps): void
  start(): void
  stop(): void
}
export const createAccordionBehavior = (): AccordionBehavior => new NativeAccordionBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagAccordionBehavior = (): AccordionBehavior =>
  new ZagBehavior<AccordionApi>(accordion.machine, accordion.connect as unknown as () => AccordionApi)

export type CheckboxApi = ReturnType<typeof checkbox.connect>
export const createCheckboxBehavior = (): ZagBehavior<CheckboxApi> =>
  new ZagBehavior<CheckboxApi>(checkbox.machine, checkbox.connect)

export type DialogApi = ReturnType<typeof dialog.connect>
export const createDialogBehavior = (): ZagBehavior<DialogApi> =>
  new ZagBehavior<DialogApi>(dialog.machine, dialog.connect)

export type HoverCardApi = ReturnType<typeof hoverCard.connect>
export const createHoverCardBehavior = (): ZagBehavior<HoverCardApi> =>
  new ZagBehavior<HoverCardApi>(hoverCard.machine, hoverCard.connect)

export type PopoverApi = ReturnType<typeof popover.connect>
export const createPopoverBehavior = (): ZagBehavior<PopoverApi> =>
  new ZagBehavior<PopoverApi>(popover.machine, popover.connect)

/**
 * Tooltip — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { TooltipApi, TooltipProps }
export interface TooltipBehavior extends BehaviorSource<TooltipApi> {
  init(props: TooltipProps): void
  start(): void
  stop(): void
}
export const createTooltipBehavior = (): TooltipBehavior => new NativeTooltipBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagTooltipBehavior = (): TooltipBehavior =>
  // zag's connect api is a structural superset; the cast bridges minor
  // signature variance (reposition options) that the tests don't exercise
  new ZagBehavior<TooltipApi>(tooltip.machine, tooltip.connect as unknown as () => TooltipApi)

/**
 * Collapsible — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { CollapsibleApi, CollapsibleProps }
export interface CollapsibleBehavior extends BehaviorSource<CollapsibleApi> {
  init(props: CollapsibleProps): void
  start(): void
  stop(): void
}
export const createCollapsibleBehavior = (): CollapsibleBehavior => new NativeCollapsibleBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagCollapsibleBehavior = (): CollapsibleBehavior =>
  new ZagBehavior<CollapsibleApi>(
    collapsible.machine,
    collapsible.connect as unknown as () => CollapsibleApi,
  )

export type PinInputApi = ReturnType<typeof pinInput.connect>
export const createPinInputBehavior = (): ZagBehavior<PinInputApi> =>
  new ZagBehavior<PinInputApi>(pinInput.machine, pinInput.connect)

export type ProgressApi = ReturnType<typeof progress.connect>
export const createProgressBehavior = (): ZagBehavior<ProgressApi> =>
  new ZagBehavior<ProgressApi>(progress.machine, progress.connect)

export type RadioGroupApi = ReturnType<typeof radioGroup.connect>
export const createRadioGroupBehavior = (): ZagBehavior<RadioGroupApi> =>
  new ZagBehavior<RadioGroupApi>(radioGroup.machine, radioGroup.connect)

export type SliderApi = ReturnType<typeof slider.connect>
export const createSliderBehavior = (): ZagBehavior<SliderApi> =>
  new ZagBehavior<SliderApi>(slider.machine, slider.connect)

export type SwitchApi = ReturnType<typeof switchNs.connect>
export const createSwitchBehavior = (): ZagBehavior<SwitchApi> =>
  new ZagBehavior<SwitchApi>(switchNs.machine, switchNs.connect)

/**
 * Tabs — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { TabsApi, TabsProps }
export interface TabsBehavior extends BehaviorSource<TabsApi> {
  init(props: TabsProps): void
  start(): void
  stop(): void
}
export const createTabsBehavior = (): TabsBehavior => new NativeTabsBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagTabsBehavior = (): TabsBehavior =>
  new ZagBehavior<TabsApi>(tabs.machine, tabs.connect as unknown as () => TabsApi)

export type ToggleGroupApi = ReturnType<typeof toggleGroup.connect>
export const createToggleGroupBehavior = (): ZagBehavior<ToggleGroupApi> =>
  new ZagBehavior<ToggleGroupApi>(toggleGroup.machine, toggleGroup.connect)

export type MenuApi = ReturnType<typeof menu.connect>
export const createMenuBehavior = (): ZagBehavior<MenuApi> =>
  new ZagBehavior<MenuApi>(menu.machine, menu.connect)

export type SelectApi = ReturnType<typeof select.connect>
export const createSelectBehavior = (): ZagBehavior<SelectApi> =>
  new ZagBehavior<SelectApi>(select.machine, select.connect)

export type ComboboxApi = ReturnType<typeof combobox.connect>
export const createComboboxBehavior = (): ZagBehavior<ComboboxApi> =>
  new ZagBehavior<ComboboxApi>(combobox.machine, combobox.connect)

export type NavigationMenuApi = ReturnType<typeof navigationMenu.connect>
export const createNavigationMenuBehavior = (): ZagBehavior<NavigationMenuApi> =>
  new ZagBehavior<NavigationMenuApi>(navigationMenu.machine, navigationMenu.connect)

/**
 * Toast — Zag's sonner-style model: a store (imperative `toaster.create()`
 * API), one group machine per region, and a child machine per visible toast.
 */
export type ToastStore = toast.Store
export type ToastOptions = toast.Options
export const createToastStore = (props: toast.StoreProps): ToastStore => toast.createStore(props)

export type ToastGroupApi = ReturnType<typeof toast.group.connect>
export const createToastGroupBehavior = (): ZagBehavior<ToastGroupApi> =>
  new ZagBehavior<ToastGroupApi>(toast.group.machine, toast.group.connect)

export type ToastApi = ReturnType<typeof toast.connect>
export const createToastBehavior = (): ZagBehavior<ToastApi> =>
  new ZagBehavior<ToastApi>(toast.machine, toast.connect)

export type DatePickerApi = ReturnType<typeof datePicker.connect>
export const createDatePickerBehavior = (): ZagBehavior<DatePickerApi> =>
  new ZagBehavior<DatePickerApi>(datePicker.machine, datePicker.connect)

/** Date helpers re-exported so registry code never imports date libs directly. */
export { parseDate, today, getLocalTimeZone, CalendarDate } from '@internationalized/date'
export type { DateValue } from '@internationalized/date'

/**
 * Carousel — embla's vanilla core behind the facade (not a Zag machine).
 * `createCarouselEngine(viewport, options)` returns the embla api.
 */
export { default as createCarouselEngine } from 'embla-carousel'
export type {
  EmblaCarouselType as CarouselEngine,
  EmblaOptionsType as CarouselOptions,
} from 'embla-carousel'

/**
 * List collection for select/combobox — wraps Zag's collection so registry
 * code never imports `@zag-js/*` directly.
 */
export type { CollectionItem, CollectionOptions } from '@zag-js/collection'
export type { ListCollection } from '@zag-js/collection'
export const createListCollection = <T extends CollectionItem>(
  options: CollectionOptions<T>,
): ListCollection<T> => select.collection(options)
