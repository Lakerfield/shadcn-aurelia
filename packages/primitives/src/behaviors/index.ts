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
import { NativeDialogBehavior, type DialogApi, type DialogProps } from '../native/dialog'
import { NativeProgressBehavior, type ProgressApi, type ProgressProps } from '../native/progress'
import { NativeSliderBehavior, type SliderApi, type SliderProps } from '../native/slider'
import {
  NativeHoverCardBehavior,
  type HoverCardApi,
  type HoverCardProps,
} from '../native/hover-card'
import { NativePopoverBehavior, type PopoverApi, type PopoverProps } from '../native/popover'
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
import { NativeCheckboxBehavior, type CheckboxApi, type CheckboxProps } from '../native/checkbox'
import { NativeSwitchBehavior, type SwitchApi, type SwitchProps } from '../native/switch'
import {
  NativeRadioGroupBehavior,
  type RadioGroupApi,
  type RadioGroupProps,
} from '../native/radio-group'
import {
  NativeToggleGroupBehavior,
  type ToggleGroupApi,
  type ToggleGroupProps,
} from '../native/toggle-group'
import {
  NativeMenuBehavior,
  type MenuApi,
  type MenuProps,
  type MenuService,
  type MenuItemProps,
  type MenuOptionItemProps,
  type MenuItemIndicatorProps,
} from '../native/menu'
import {
  NativeSelectBehavior,
  type SelectApi,
  type SelectProps,
  type SelectItemProps,
  type SelectItemState,
} from '../native/select'
import {
  NativeComboboxBehavior,
  type ComboboxApi,
  type ComboboxProps,
  type ComboboxItemProps,
  type ComboboxItemState,
} from '../native/combobox'

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
  new ZagBehavior<AccordionApi>(
    accordion.machine,
    accordion.connect as unknown as () => AccordionApi,
  )

/**
 * Checkbox — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { CheckboxApi, CheckboxProps }
export interface CheckboxBehavior extends BehaviorSource<CheckboxApi> {
  init(props: CheckboxProps): void
  start(): void
  stop(): void
}
export const createCheckboxBehavior = (): CheckboxBehavior => new NativeCheckboxBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagCheckboxBehavior = (): CheckboxBehavior =>
  new ZagBehavior<CheckboxApi>(checkbox.machine, checkbox.connect as unknown as () => CheckboxApi)

/**
 * Dialog — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { DialogApi, DialogProps }
export interface DialogBehavior extends BehaviorSource<DialogApi> {
  init(props: DialogProps): void
  start(): void
  stop(): void
}
export const createDialogBehavior = (): DialogBehavior => new NativeDialogBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagDialogBehavior = (): DialogBehavior =>
  new ZagBehavior<DialogApi>(dialog.machine, dialog.connect as unknown as () => DialogApi)

/**
 * Hover card — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { HoverCardApi, HoverCardProps }
export interface HoverCardBehavior extends BehaviorSource<HoverCardApi> {
  init(props: HoverCardProps): void
  start(): void
  stop(): void
}
export const createHoverCardBehavior = (): HoverCardBehavior => new NativeHoverCardBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagHoverCardBehavior = (): HoverCardBehavior =>
  new ZagBehavior<HoverCardApi>(
    hoverCard.machine,
    hoverCard.connect as unknown as () => HoverCardApi,
  )

/**
 * Popover — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { PopoverApi, PopoverProps }
export interface PopoverBehavior extends BehaviorSource<PopoverApi> {
  init(props: PopoverProps): void
  start(): void
  stop(): void
}
export const createPopoverBehavior = (): PopoverBehavior => new NativePopoverBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagPopoverBehavior = (): PopoverBehavior =>
  new ZagBehavior<PopoverApi>(popover.machine, popover.connect as unknown as () => PopoverApi)

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

/**
 * Progress — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { ProgressApi, ProgressProps }
export interface ProgressBehavior extends BehaviorSource<ProgressApi> {
  init(props: ProgressProps): void
  start(): void
  stop(): void
}
export const createProgressBehavior = (): ProgressBehavior => new NativeProgressBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagProgressBehavior = (): ProgressBehavior =>
  new ZagBehavior<ProgressApi>(progress.machine, progress.connect as unknown as () => ProgressApi)

/**
 * Radio group — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { RadioGroupApi, RadioGroupProps }
export interface RadioGroupBehavior extends BehaviorSource<RadioGroupApi> {
  init(props: RadioGroupProps): void
  start(): void
  stop(): void
}
export const createRadioGroupBehavior = (): RadioGroupBehavior => new NativeRadioGroupBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagRadioGroupBehavior = (): RadioGroupBehavior =>
  new ZagBehavior<RadioGroupApi>(
    radioGroup.machine,
    radioGroup.connect as unknown as () => RadioGroupApi,
  )

/**
 * Slider — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { SliderApi, SliderProps }
export interface SliderBehavior extends BehaviorSource<SliderApi> {
  init(props: SliderProps): void
  start(): void
  stop(): void
}
export const createSliderBehavior = (): SliderBehavior => new NativeSliderBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagSliderBehavior = (): SliderBehavior =>
  new ZagBehavior<SliderApi>(slider.machine, slider.connect as unknown as () => SliderApi)

/**
 * Switch — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { SwitchApi, SwitchProps }
export interface SwitchBehavior extends BehaviorSource<SwitchApi> {
  init(props: SwitchProps): void
  start(): void
  stop(): void
}
export const createSwitchBehavior = (): SwitchBehavior => new NativeSwitchBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagSwitchBehavior = (): SwitchBehavior =>
  new ZagBehavior<SwitchApi>(switchNs.machine, switchNs.connect as unknown as () => SwitchApi)

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

/**
 * Toggle group — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { ToggleGroupApi, ToggleGroupProps }
export interface ToggleGroupBehavior extends BehaviorSource<ToggleGroupApi> {
  init(props: ToggleGroupProps): void
  start(): void
  stop(): void
}
export const createToggleGroupBehavior = (): ToggleGroupBehavior => new NativeToggleGroupBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagToggleGroupBehavior = (): ToggleGroupBehavior =>
  new ZagBehavior<ToggleGroupApi>(
    toggleGroup.machine,
    toggleGroup.connect as unknown as () => ToggleGroupApi,
  )

/**
 * Menu — native engine (Phase 8), shared by dropdown-menu, context-menu and
 * menubar. The Zag variant remains only as the reference implementation for
 * the dual-engine contract tests. Submenus link machines via
 * `api.setParent(parent.service)` / `parent.api.setChild(child.service)`;
 * trees never mix engines, so the service handle stays opaque.
 */
export type {
  MenuApi,
  MenuProps,
  MenuService,
  MenuItemProps,
  MenuOptionItemProps,
  MenuItemIndicatorProps,
}
export interface MenuBehavior extends BehaviorSource<MenuApi> {
  init(props: MenuProps): void
  start(): void
  stop(): void
  notify(): void
  /** Raw machine handle — machine linking only, never used for prop bags. */
  readonly service: unknown
}
export const createMenuBehavior = (): MenuBehavior => new NativeMenuBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagMenuBehavior = (): MenuBehavior =>
  new ZagBehavior<MenuApi>(menu.machine, menu.connect as unknown as () => MenuApi)

/**
 * Select — native engine (Phase 8). The Zag variant remains only as the
 * reference implementation for the dual-engine contract tests.
 */
export type { SelectApi, SelectProps, SelectItemProps, SelectItemState }
export interface SelectBehavior extends BehaviorSource<SelectApi> {
  init(props: SelectProps): void
  updateProps(props: Partial<SelectProps>): void
  start(): void
  stop(): void
  notify(): void
}
export const createSelectBehavior = (): SelectBehavior => new NativeSelectBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagSelectBehavior = (): SelectBehavior =>
  new ZagBehavior<SelectApi>(select.machine, select.connect as unknown as () => SelectApi)

/**
 * Combobox — native engine (Phase 8), also driving the command palette
 * (controlled `open: true` + `disableLayer`). The Zag variant remains only as
 * the reference implementation for the dual-engine contract tests.
 */
export type { ComboboxApi, ComboboxProps, ComboboxItemProps, ComboboxItemState }
export interface ComboboxBehavior extends BehaviorSource<ComboboxApi> {
  init(props: ComboboxProps): void
  updateProps(props: Partial<ComboboxProps>): void
  start(): void
  stop(): void
  notify(): void
}
export const createComboboxBehavior = (): ComboboxBehavior => new NativeComboboxBehavior()

/** @internal Zag reference engine — dual-engine tests only, not public API. */
export const createZagComboboxBehavior = (): ComboboxBehavior =>
  new ZagBehavior<ComboboxApi>(combobox.machine, combobox.connect as unknown as () => ComboboxApi)

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
