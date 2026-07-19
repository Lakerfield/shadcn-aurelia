/**
 * Native engines (Phase 8) — hand-written replacements for Zag machines,
 * exposed only through the `create*Behavior()` factories in `behaviors/`.
 * Each migration ships with a dual-engine test suite proving the attribute,
 * ARIA and interaction contract matches the Zag original.
 */
export {
  NativeTooltipBehavior,
  createNativeTooltipBehavior,
  type TooltipProps,
  type TooltipApi,
} from './tooltip'
export {
  NativeCollapsibleBehavior,
  createNativeCollapsibleBehavior,
  type CollapsibleProps,
  type CollapsibleApi,
} from './collapsible'
export {
  NativeAccordionBehavior,
  createNativeAccordionBehavior,
  type AccordionProps,
  type AccordionApi,
  type AccordionItemProps,
  type AccordionItemState,
} from './accordion'
export {
  NativeTabsBehavior,
  createNativeTabsBehavior,
  type TabsProps,
  type TabsApi,
  type TabsTriggerProps,
  type TabsTriggerState,
} from './tabs'
export {
  NativeCheckboxBehavior,
  createNativeCheckboxBehavior,
  type CheckboxProps,
  type CheckboxApi,
  type CheckedState,
} from './checkbox'
export {
  NativeSwitchBehavior,
  createNativeSwitchBehavior,
  type SwitchProps,
  type SwitchApi,
} from './switch'
export {
  NativeRadioGroupBehavior,
  createNativeRadioGroupBehavior,
  type RadioGroupProps,
  type RadioGroupApi,
  type RadioItemProps,
  type RadioItemState,
} from './radio-group'
export {
  NativeToggleGroupBehavior,
  createNativeToggleGroupBehavior,
  type ToggleGroupProps,
  type ToggleGroupApi,
  type ToggleItemProps,
  type ToggleItemState,
} from './toggle-group'
export {
  NativeProgressBehavior,
  createNativeProgressBehavior,
  type ProgressProps,
  type ProgressApi,
} from './progress'
export {
  NativeSliderBehavior,
  createNativeSliderBehavior,
  type SliderProps,
  type SliderApi,
} from './slider'
export {
  NativeHoverCardBehavior,
  createNativeHoverCardBehavior,
  type HoverCardProps,
  type HoverCardApi,
} from './hover-card'
export {
  NativePopoverBehavior,
  createNativePopoverBehavior,
  type PopoverProps,
  type PopoverApi,
} from './popover'
export {
  NativeDialogBehavior,
  createNativeDialogBehavior,
  type DialogProps,
  type DialogApi,
} from './dialog'
export {
  NativeMenuBehavior,
  createNativeMenuBehavior,
  type MenuProps,
  type MenuApi,
  type MenuService,
  type MenuItemProps,
  type MenuOptionItemProps,
  type MenuItemIndicatorProps,
  type MenuPoint,
} from './menu'
export {
  trackPlacement,
  getFloatingStyleString,
  getPlacementSide,
  type PositioningOptions,
  type Placement,
} from './positioning'
