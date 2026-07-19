/**
 * Native floating positioning — @floating-ui/dom driven, reproducing the
 * @zag-js/popper contract that the registry styles already rely on:
 *
 *   • the positioner receives the `getPlacementStyles().floating` inline
 *     style (`position/isolation/min-width/top/left/transform/z-index`,
 *     off-screen until a placement is known)
 *   • position lands in `--x`/`--y` custom properties (DPR-rounded, only
 *     written on real change), `--z-index` is read once from the content
 *   • `--transform-origin` and the size vars (`--reference-width/height`,
 *     `--available-width/height`) are written for animation/sizing utilities
 *
 * Zag machines and native engines therefore stay pixel- and
 * attribute-identical during the Phase 8 migration.
 */
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  limitShift,
  offset,
  shift,
  size,
  type Middleware,
  type Placement,
  type ReferenceElement,
  type VirtualElement,
} from '@floating-ui/dom'

export type { Placement, VirtualElement }
export { getOverflowAncestors } from '@floating-ui/dom'

export interface PositioningOptions {
  /**
   * floating-ui placement, e.g. `top`, `bottom-start`. Default `bottom`.
   * Plain strings are accepted so template bindables can pass through.
   */
  placement?: Placement | (string & {})
  strategy?: 'absolute' | 'fixed'
  /** Main-axis distance to the reference (px). Default 8. */
  gutter?: number
  offset?: { mainAxis?: number; crossAxis?: number }
  /** Cross-axis shift applied via the offset middleware. */
  shift?: number
  flip?: boolean | Placement[]
  /** Allow shifting along the main axis to stay in view. Default true. */
  slide?: boolean
  overlap?: boolean
  sameWidth?: boolean
  fitViewport?: boolean
  overflowPadding?: number
  arrowPadding?: number
  /** Keep position in sync via autoUpdate. Default true. */
  listeners?: boolean
}

interface ResolvedPositioning extends Omit<PositioningOptions, 'placement'> {
  placement: Placement
  strategy: 'absolute' | 'fixed'
  gutter: number
  flip: boolean | Placement[]
  slide: boolean
  overlap: boolean
  sameWidth: boolean
  fitViewport: boolean
  overflowPadding: number
  arrowPadding: number
  listeners: boolean
}

const defaultOptions = {
  strategy: 'absolute',
  placement: 'bottom',
  listeners: true,
  gutter: 8,
  flip: true,
  slide: true,
  overlap: false,
  sameWidth: false,
  fitViewport: false,
  overflowPadding: 8,
  arrowPadding: 4,
} satisfies PositioningOptions

const compact = <T extends object>(obj: T): T => {
  const out = {} as T
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) (out as Record<string, unknown>)[key] = value
  }
  return out
}

export const getPlacementSide = (placement: Placement): string => placement.split('-')[0]

/**
 * The positioner's inline style, serialized exactly like Zag's
 * `getPlacementStyles().floating` (same declarations, same order).
 */
export function getFloatingStyleString(
  placement: Placement | undefined,
  options: PositioningOptions = {},
): string {
  const { sameWidth, fitViewport, strategy = 'absolute' } = options
  let style = `position:${strategy};isolation:isolate;`
  if (!sameWidth) style += 'min-width:max-content;'
  if (sameWidth) style += 'width:var(--reference-width);'
  if (fitViewport) style += 'max-width:var(--available-width);max-height:var(--available-height);'
  if (!placement) style += 'pointer-events:none;'
  style += 'top:0px;left:0px;'
  style += placement
    ? 'transform:translate3d(var(--x), var(--y), 0);'
    : 'transform:translate3d(0, -100vh, 0);'
  style += 'z-index:var(--z-index);'
  return style
}

const isApproximatelyEqual = (a: number | undefined, b: number): boolean =>
  a != null && Math.abs(a - b) < 0.5

const roundByDpr = (value: number): number => {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return Math.round(value * dpr) / dpr
}

const getSideAxis = (side: string): 'x' | 'y' => (side === 'top' || side === 'bottom' ? 'y' : 'x')

/** Writes `--transform-origin` the way Zag's popper middleware does. */
function transformOriginMiddleware(opts: ResolvedPositioning, arrowEl: HTMLElement | null): Middleware {
  return {
    name: 'transformOrigin',
    fn(state) {
      const { elements, middlewareData, placement, rects, y } = state
      const side = getPlacementSide(placement)
      const axis = getSideAxis(side)
      const arrowX = middlewareData.arrow?.x || 0
      const arrowY = middlewareData.arrow?.y || 0
      const arrowWidth = arrowEl?.clientWidth || 0
      const arrowHeight = arrowEl?.clientHeight || 0
      const transformX = arrowX + arrowWidth / 2
      const transformY = arrowY + arrowHeight / 2
      const shiftY = Math.abs(middlewareData.shift?.y || 0)
      const arrowOffset = arrowHeight / 2
      const gutter = opts.offset?.mainAxis ?? opts.gutter
      const sideOffsetValue = typeof gutter === 'number' ? gutter + arrowOffset : (gutter ?? arrowOffset)
      const isOverlappingAnchor = shiftY > sideOffsetValue
      const adjacentTransformOrigin = {
        top: `${transformX}px calc(100% + ${sideOffsetValue}px)`,
        bottom: `${transformX}px ${-sideOffsetValue}px`,
        left: `calc(100% + ${sideOffsetValue}px) ${transformY}px`,
        right: `${-sideOffsetValue}px ${transformY}px`,
      }[side]!
      const overlapTransformOrigin = `${transformX}px ${rects.reference.y + rects.reference.height / 2 - y}px`
      const useOverlap = Boolean(opts.overlap) && axis === 'y' && isOverlappingAnchor
      const transformOrigin = useOverlap ? overlapTransformOrigin : adjacentTransformOrigin
      elements.floating.style.setProperty('--transform-origin', transformOrigin)
      return { data: { transformOrigin } }
    },
  }
}

export interface TrackPlacementOptions extends PositioningOptions {
  /** Wait a frame before the first computation (Zag's `defer`). */
  defer?: boolean
  onComplete?: (data: { placement: Placement }) => void
}

/**
 * Position `floating` relative to `reference` and keep it in sync while the
 * returned cleanup hasn't run. Elements are resolved lazily so this can be
 * started before the parts mount. The reference may be a floating-ui virtual
 * element (context menu anchoring at a pointer coordinate).
 */
export function trackPlacement(
  getReference: () => ReferenceElement | null,
  getFloating: () => HTMLElement | null,
  options: TrackPlacementOptions = {},
): () => void {
  const { defer, onComplete, ...positioning } = options
  const opts = { ...defaultOptions, ...compact(positioning) } as ResolvedPositioning

  let middleware: Array<Middleware | undefined> = []
  let middlewareFloating: HTMLElement | null = null
  let lastX: number | undefined
  let lastY: number | undefined
  let lastReferenceWidth: number | undefined
  let lastReferenceHeight: number | undefined
  let lastAvailableWidth: number | undefined
  let lastAvailableHeight: number | undefined
  let zIndexComputed = false
  let lastObservedReference: ReferenceElement | null = null
  let lastObservedFloating: HTMLElement | null = null
  let cancelAutoUpdate: (() => void) | null = null
  let disposed = false

  const buildMiddleware = (floating: HTMLElement) => {
    middlewareFloating = floating
    const arrowEl = floating.querySelector<HTMLElement>('[data-part=arrow]')
    // Zag runs the arrow middleware even without an arrow (dummy element) so
    // --transform-origin gets the arrow-centered x/y; replicate for parity.
    const arrowTarget = arrowEl ?? floating.ownerDocument.createElement('div')
    middleware = [
      offset(({ placement }) => {
        const arrowOffset = (arrowEl?.clientHeight || 0) / 2
        const gutter = opts.offset?.mainAxis ?? opts.gutter
        const mainAxis = typeof gutter === 'number' ? gutter + arrowOffset : (gutter ?? arrowOffset)
        const hasAlign = placement.includes('-')
        const crossAxis = opts.offset?.crossAxis ?? (!hasAlign ? opts.shift : undefined)
        return compact({ crossAxis, mainAxis, alignmentAxis: opts.shift })
      }),
      opts.flip
        ? flip({
            padding: opts.overflowPadding,
            fallbackPlacements: opts.flip === true ? undefined : opts.flip,
          })
        : undefined,
      opts.slide || opts.overlap
        ? shift({
            mainAxis: opts.slide,
            crossAxis: opts.overlap,
            padding: opts.overflowPadding,
            limiter: limitShift(),
          })
        : undefined,
      arrow({ element: arrowTarget, padding: opts.arrowPadding }),
      transformOriginMiddleware(opts, arrowEl),
      size({
        padding: opts.overflowPadding,
        apply({ elements, rects, availableHeight, availableWidth }) {
              const floatingEl = elements.floating
              const referenceWidth = Math.round(rects.reference.width)
              const referenceHeight = Math.round(rects.reference.height)
              availableWidth = Math.floor(availableWidth)
              availableHeight = Math.floor(availableHeight)
          if (!isApproximatelyEqual(lastReferenceWidth, referenceWidth)) {
            floatingEl.style.setProperty('--reference-width', `${referenceWidth}px`)
            lastReferenceWidth = referenceWidth
          }
          if (!isApproximatelyEqual(lastReferenceHeight, referenceHeight)) {
            floatingEl.style.setProperty('--reference-height', `${referenceHeight}px`)
            lastReferenceHeight = referenceHeight
          }
          if (!isApproximatelyEqual(lastAvailableWidth, availableWidth)) {
            floatingEl.style.setProperty('--available-width', `${availableWidth}px`)
            lastAvailableWidth = availableWidth
          }
          if (!isApproximatelyEqual(lastAvailableHeight, availableHeight)) {
            floatingEl.style.setProperty('--available-height', `${availableHeight}px`)
            lastAvailableHeight = availableHeight
          }
        },
      }),
    ]
  }

  const syncAutoUpdate = () => {
    if (!opts.listeners) return
    const reference = getReference()
    const floating = getFloating()
    if (!reference || !floating) return
    if (reference === lastObservedReference && floating === lastObservedFloating) return
    cancelAutoUpdate?.()
    lastObservedReference = reference
    lastObservedFloating = floating
    cancelAutoUpdate = autoUpdate(reference, floating, () => void updatePosition(), {
      ancestorResize: true,
      ancestorScroll: true,
      elementResize: true,
      layoutShift: true,
    })
  }

  async function updatePosition(): Promise<void> {
    if (disposed) return
    syncAutoUpdate()
    const floating = getFloating()
    if (!floating) return
    if (floating !== middlewareFloating) {
      buildMiddleware(floating)
      zIndexComputed = false
    }
    const reference = getReference()
    if (!reference) return
    const pos = await computePosition(reference, floating, {
      placement: opts.placement,
      strategy: opts.strategy,
      middleware: middleware.filter((m): m is Middleware => m != null),
    })
    if (disposed) return
    onComplete?.({ placement: pos.placement })
    const x = roundByDpr(pos.x)
    const y = roundByDpr(pos.y)
    if (!isApproximatelyEqual(lastX, x)) {
      floating.style.setProperty('--x', `${x}px`)
      lastX = x
    }
    if (!isApproximatelyEqual(lastY, y)) {
      floating.style.setProperty('--y', `${y}px`)
      lastY = y
    }
    if (!zIndexComputed) {
      const contentEl = floating.firstElementChild
      if (contentEl) {
        floating.style.setProperty('--z-index', getComputedStyle(contentEl).zIndex)
        zIndexComputed = true
      }
    }
  }

  let rafId: number | null = null
  if (defer && typeof requestAnimationFrame !== 'undefined') {
    rafId = requestAnimationFrame(() => {
      rafId = null
      void updatePosition()
    })
  } else {
    void updatePosition()
  }

  return () => {
    disposed = true
    if (rafId !== null) cancelAnimationFrame(rafId)
    cancelAutoUpdate?.()
    cancelAutoUpdate = null
  }
}
