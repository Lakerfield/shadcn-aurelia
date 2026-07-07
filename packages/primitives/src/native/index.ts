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
  trackPlacement,
  getFloatingStyleString,
  getPlacementSide,
  type PositioningOptions,
  type Placement,
} from './positioning'
