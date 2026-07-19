/**
 * Native slider engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/slider` behind the facade: the prop bags
 * (root/control/track/range/thumb/hiddenInput) emit the exact attribute,
 * ARIA, style and event contract the Zag connect produced (keys and style
 * strings pre-normalized the way `@zag-js/vanilla` would), verified by the
 * dual-engine suite in `test/slider.spec.ts`.
 *
 * Model (Zag's three states):
 *   idle → focus     (thumb focus)             — arrows/Home/End move the thumb
 *   idle|focus → dragging (pointerdown on control or thumb)
 *   dragging → focus (pointerup)               — document-level move tracking
 * Values live in an array (multi-thumb ranges); every change clamps between
 * the neighbouring thumbs, snaps to `step`, syncs the hidden inputs and fires
 * a bubbling `input` event per input (Zag's dispatchChangeEvent). Positions
 * are pure CSS: the root publishes `--slider-thumb-offset-{i}` /
 * `--slider-range-start/end` custom properties the parts consume.
 *
 * Not ported (unused by the registry component): `thumbCollisionBehavior`
 * "push"/"swap" (registry uses the default "none"), marker/markerGroup/
 * draggingIndicator/label/valueText parts, fieldset-disabled tracking,
 * per-part `ids` overrides, and thumb-size ResizeObserver re-measurement
 * (the size is measured once on start when no `thumbSize` prop is given —
 * the registry always passes one).
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import { getEventKey } from './keyboard'
import { dispatchInputValueEvent, trackFormReset } from './form'

type Orientation = 'horizontal' | 'vertical'
type Point = { x: number; y: number }
type Size = { width: number; height: number }

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type SliderProps = {
  /** Unique machine id — element ids derive from it (`slider:{id}:thumb:0`). */
  id: string
  dir?: 'ltr' | 'rtl'
  orientation?: Orientation
  min?: number
  max?: number
  step?: number
  defaultValue?: number[]
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  name?: string
  form?: string
  largeStep?: number
  minStepsBetweenThumbs?: number
  /** Where the range fill starts for single-thumb sliders. Default 'start'. */
  origin?: 'start' | 'center' | 'end'
  thumbAlignment?: 'contain' | 'center'
  thumbSize?: Size
  'aria-label'?: string | string[]
  'aria-labelledby'?: string | string[]
  getAriaValueText?: (details: { value: number; index: number }) => string
  onValueChange?: (details: { value: number[] }) => void
  onValueChangeEnd?: (details: { value: number[] }) => void
  onFocusChange?: (details: { focusedIndex: number; value: number[] }) => void
}

export interface SliderApi {
  value: number[]
  dragging: boolean
  focused: boolean
  setValue(value: number[]): void
  getThumbValue(index: number): number
  setThumbValue(index: number, value: number): void
  getThumbPercent(index: number): number
  getThumbMin(index: number): number
  getThumbMax(index: number): number
  increment(index?: number): void
  decrement(index?: number): void
  focus(): void
  getRootProps(): Record<string, unknown>
  getControlProps(): Record<string, unknown>
  getTrackProps(): Record<string, unknown>
  getRangeProps(): Record<string, unknown>
  getThumbProps(props: { index?: number }): Record<string, unknown>
  getHiddenInputProps(props: { index?: number; name?: string }): Record<string, unknown>
}

interface ResolvedSliderProps extends SliderProps {
  dir: 'ltr' | 'rtl'
  orientation: Orientation
  min: number
  max: number
  step: number
  largeStep: number
  minStepsBetweenThumbs: number
  origin: 'start' | 'center' | 'end'
  thumbAlignment: 'contain' | 'center'
}

type SliderState = 'idle' | 'focus' | 'dragging'

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

/* ------------------------------------------------------- number helpers */
/* Faithful ports of the `@zag-js/utils` functions the Zag machine uses, so
 * both engines produce bit-identical values (float rounding included). */

const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max)

const round10 = (v: number): number => Math.round(v * 1e10) / 1e10

function roundToStepPrecision(v: number, step: number): number {
  const stepStr = step.toString()
  const dot = stepStr.indexOf('.')
  const precision = dot >= 0 ? stepStr.length - dot : 0
  if (precision > 0) {
    const pow = 10 ** precision
    return Math.round(v * pow) / pow
  }
  return v
}

function snapValueToStep(v: number, min: number, max: number, step: number): number {
  const remainder = (v - min) % step
  let snapped =
    Math.abs(remainder) * 2 >= step
      ? v + Math.sign(remainder) * (step - Math.abs(remainder))
      : v - remainder
  snapped = roundToStepPrecision(snapped, step)
  if (snapped < min) {
    snapped = min
  } else if (snapped > max) {
    const stepsInRange = Math.floor((max - min) / step)
    const largestValidStep = min + stepsInRange * step
    snapped = stepsInRange <= 0 || largestValidStep < min ? max : largestValidStep
  }
  return roundToStepPrecision(snapped, step)
}

/** percent (0..1) → value snapped to step and clamped. */
function getPercentValue(p: number, min: number, max: number, step: number): number {
  const raw = Math.round((p * (max - min) + min - min) / step) * step + min
  return clamp(raw, min, max)
}

interface ValueRange {
  min: number
  max: number
  value: number
}

function getValueRanges(values: number[], min: number, max: number, gap: number): ValueRange[] {
  return values.map((value, i) => ({
    min: i === 0 ? min : values[i - 1] + gap,
    max: i === values.length - 1 ? max : values[i + 1] - gap,
    value,
  }))
}

export class NativeSliderBehavior implements BehaviorSource<SliderApi> {
  api: SliderApi | null = null

  private props!: ResolvedSliderProps
  private state: SliderState = 'idle'
  private value: number[] = []
  private initialValue: number[] = []
  private focusedIndex = -1
  private thumbSize: Size | null = null
  private thumbDragOffset: Point | null = null
  private thumbDragStartValue: number[] | null = null
  private readonly listeners = new Set<() => void>()
  private cleanups: Array<() => void> = []
  private dragCleanup: (() => void) | null = null
  private started = false

  init(props: SliderProps): void {
    if (!props.id) throw new Error('[slider] `id` is required')
    const min = props.min ?? 0
    const max = props.max ?? 100
    const step = props.step ?? 1
    this.props = {
      dir: 'ltr',
      orientation: 'horizontal',
      origin: 'start',
      thumbAlignment: 'contain',
      minStepsBetweenThumbs: 0,
      ...props,
      largeStep: props.largeStep ?? 10 * step,
      min,
      max,
      step,
    }
    this.value = this.normalizeInitial(props.defaultValue ?? [min])
    this.initialValue = this.value.slice()
    this.thumbSize = props.thumbSize ?? null
  }

  updateProps(props: Partial<SliderProps>): void {
    const wasInteractive = this.interactive
    this.props = { ...this.props, ...props } as ResolvedSliderProps
    if (wasInteractive && !this.interactive) this.pointerCancel()
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.api = this.buildApi()
    // deferred one frame so bindPart has written the part ids
    const frame = requestAnimationFrame(() => {
      if (!this.started) return
      const rootEl = this.getEl('')
      const reset = trackFormReset(rootEl, () => this.setValueInternal(this.initialValue.slice()))
      if (reset) this.cleanups.push(reset)
      this.measureThumbSize()
    })
    this.cleanups.push(() => cancelAnimationFrame(frame))
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.dragCleanup?.()
    this.dragCleanup = null
    this.cleanups.forEach((fn) => fn())
    this.cleanups = []
    this.state = 'idle'
    this.focusedIndex = -1
    this.api = null
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify(): void {
    this.listeners.forEach((l) => l())
  }

  /* ------------------------------------------------------------ computed */

  private get disabled(): boolean {
    return !!this.props.disabled
  }

  private get interactive(): boolean {
    return !(this.props.readOnly || this.disabled)
  }

  private get isVertical(): boolean {
    return this.props.orientation === 'vertical'
  }

  private get isRtl(): boolean {
    return this.props.orientation === 'horizontal' && this.props.dir === 'rtl'
  }

  private get gap(): number {
    return this.props.step * this.props.minStepsBetweenThumbs
  }

  private valuePercent(value: number): number {
    // same float operation order as Zag (100 * ratio, not (100*v)/range) so
    // the emitted percent strings are bit-identical
    return 100 * ((value - this.props.min) / (this.props.max - this.props.min))
  }

  private rangeAt(index: number): ValueRange {
    return getValueRanges(this.value, this.props.min, this.props.max, this.gap)[index]
  }

  /* ------------------------------------------------------------- machine */

  private normalizeInitial(values: number[]): number[] {
    const { min, max, step } = this.props
    return getValueRanges(values, min, max, this.gap).map((range) => {
      const snapped = clamp(snapValueToStep(range.value, range.min, range.max, step), range.min, range.max)
      if (snapped < min || snapped > max) {
        throw new Error('[slider] The configured `min`, `max`, `step` or `minStepsBetweenThumbs` values are invalid')
      }
      return snapped
    })
  }

  private constrainValue(value: number, index: number): number {
    const range = this.rangeAt(index)
    const snapped = snapValueToStep(value, this.props.min, this.props.max, this.props.step)
    return clamp(snapped, range.min, range.max)
  }

  private setValueInternal(next: number[]): void {
    if (next.join(',') === this.value.join(',')) return
    this.value = next
    this.props.onValueChange?.({ value: next })
    this.syncInputElements()
    this.notify()
  }

  private syncInputElements(): void {
    this.value.forEach((value, index) => {
      const inputEl = this.getEl(`:input:${index}`) as HTMLInputElement | null
      dispatchInputValueEvent(inputEl, value)
    })
  }

  private invokeOnChangeEnd(): void {
    queueMicrotask(() => this.props.onValueChangeEnd?.({ value: this.value }))
  }

  private setFocusedIndex(index: number): void {
    const movable = this.selectMovableThumb(index)
    if (movable === this.focusedIndex) return
    this.focusedIndex = movable
    this.props.onFocusChange?.({ focusedIndex: movable, value: this.value })
  }

  /** Zag's selectMovableThumb: on a max-stacked pile, move the lowest thumb. */
  private selectMovableThumb(index: number): number {
    const { max } = this.props
    if (this.value[index] === max) {
      let movable = index
      while (movable > 0 && this.value[movable - 1] === max) movable -= 1
      return movable
    }
    return index
  }

  private getClosestIndex(pointValue: number): number {
    let closest = 0
    let minDistance = Math.abs(this.value[0] - pointValue)
    for (let i = 1; i < this.value.length; i++) {
      const distance = Math.abs(this.value[i] - pointValue)
      if (distance <= minDistance) {
        closest = i
        minDistance = distance
      }
    }
    return this.selectMovableThumb(closest)
  }

  /** Zag's resolveThumbCollision, behavior "none": clamp between neighbours. */
  private resolveCollision(index: number, value: number): number[] {
    if (this.value.length === 1) {
      return [round10(clamp(value, this.props.min, this.props.max))]
    }
    const range = this.rangeAt(index)
    const next = this.value.slice()
    next[index] = round10(clamp(value, range.min, range.max))
    return next
  }

  private stepValue(index: number, direction: 1 | -1, step?: number): number[] {
    const idx = index ?? this.focusedIndex
    const range = this.rangeAt(idx)
    const rawNext = this.value[idx] + direction * (step ?? this.props.step)
    // Zag's getValueSetterAtIndex snaps relative to the neighbour-bounded range
    const snapped = snapValueToStep(rawNext, range.min, range.max, step ?? this.props.step)
    const next = this.value.slice()
    next[idx] = clamp(snapped, range.min, range.max)
    return next
  }

  private focusActiveThumb(): void {
    requestAnimationFrame(() => {
      const thumbEl = this.getEl(`:thumb:${this.focusedIndex}`)
      thumbEl?.focus({ preventScroll: true })
    })
  }

  private pointerCancel(): void {
    if (this.state !== 'dragging') return
    this.dragCleanup?.()
    this.dragCleanup = null
    this.state = 'idle'
    this.focusedIndex = -1
    this.thumbDragOffset = null
    this.thumbDragStartValue = null
    this.notify()
  }

  /* ------------------------------------------------------------ dragging */

  private startDragging(): void {
    this.state = 'dragging'
    this.focusActiveThumb()
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        onPointerUp()
        return
      }
      this.setPointerValue({ x: event.clientX, y: event.clientY })
    }
    const onPointerUp = () => {
      this.dragCleanup?.()
      this.dragCleanup = null
      this.state = 'focus'
      this.thumbDragOffset = null
      this.thumbDragStartValue = null
      this.invokeOnChangeEnd()
      this.notify()
    }
    const doc = document
    const prevUserSelect = doc.documentElement.style.userSelect
    doc.documentElement.style.userSelect = 'none'
    doc.addEventListener('pointermove', onPointerMove)
    doc.addEventListener('pointerup', onPointerUp)
    doc.addEventListener('pointercancel', onPointerUp)
    doc.addEventListener('contextmenu', onPointerUp)
    this.dragCleanup = () => {
      doc.documentElement.style.userSelect = prevUserSelect
      if (doc.documentElement.style.length === 0) doc.documentElement.removeAttribute('style')
      doc.removeEventListener('pointermove', onPointerMove)
      doc.removeEventListener('pointerup', onPointerUp)
      doc.removeEventListener('pointercancel', onPointerUp)
      doc.removeEventListener('contextmenu', onPointerUp)
    }
    this.notify()
  }

  /** Zag's dom.getPointValue: pointer position → snapped value. */
  private getPointValue(point: Point): number | undefined {
    const controlEl = this.getEl(':control')
    if (!controlEl) return undefined
    const adjusted = {
      x: point.x - (this.thumbDragOffset?.x ?? 0),
      y: point.y - (this.thumbDragOffset?.y ?? 0),
    }
    const inset =
      this.props.thumbAlignment === 'contain'
        ? ((this.isVertical ? this.thumbSize?.height : this.thumbSize?.width) ?? 0) / 2
        : 0
    const { left, top, width, height } = controlEl.getBoundingClientRect()
    const effectiveWidth = width - inset * 2
    const effectiveHeight = height - inset * 2
    const offset = { x: adjusted.x - (left + inset), y: adjusted.y - (top + inset) }
    const percentPoint = {
      x: effectiveWidth > 0 ? clamp(offset.x / effectiveWidth, 0, 1) : 0,
      y: effectiveHeight > 0 ? clamp(offset.y / effectiveHeight, 0, 1) : 0,
    }
    const percent = this.isVertical
      ? 1 - percentPoint.y
      : this.props.dir === 'rtl'
        ? 1 - percentPoint.x
        : percentPoint.x
    return getPercentValue(percent, this.props.min, this.props.max, this.props.step)
  }

  private setPointerValue(point: Point): void {
    const pointValue = this.getPointValue(point)
    if (pointValue == null) return
    this.setValueInternal(this.resolveCollision(this.focusedIndex, pointValue))
  }

  private measureThumbSize(): void {
    if (this.props.thumbAlignment !== 'contain' || this.props.thumbSize) return
    const controlEl = this.getEl(':control')
    const thumbEl = controlEl?.querySelector<HTMLElement>('[role=slider]')
    if (!thumbEl) return
    const size = { width: thumbEl.offsetWidth, height: thumbEl.offsetHeight }
    if (this.thumbSize?.width === size.width && this.thumbSize?.height === size.height) return
    this.thumbSize = size
    this.notify()
  }

  /* --------------------------------------------------------------- style */

  /** Zag's getThumbOffset: percent corrected for the thumb's own size. */
  private thumbOffset(value: number): string {
    const percent = this.valuePercent(value)
    if (this.props.thumbAlignment === 'center') return `${percent}%`
    const { min, max } = this.props
    const size = (this.isVertical ? this.thumbSize?.height : this.thumbSize?.width) ?? 0
    // linear map value ∈ [min,max] → [-size/2, size/2]; Zag mirrors the range
    // AND negates the result for RTL, which cancels out to the LTR offset
    const raw = min === max ? -size / 2 : -size / 2 + ((value - min) / (max - min)) * size
    const offset = this.isRtl ? -parseFloat((-raw).toFixed(2)) : parseFloat(raw.toFixed(2))
    return `calc(${percent}% - ${offset}px)`
  }

  private rangeOffsets(): { start: string; end: string } {
    const percents = this.value.map((v) => this.valuePercent(v))
    const first = percents[0]
    const last = percents[percents.length - 1]
    if (percents.length === 1) {
      if (this.props.origin === 'center') {
        const isNegative = percents[0] < 50
        return {
          start: isNegative ? `${percents[0]}%` : '50%',
          end: isNegative ? '50%' : `${100 - percents[0]}%`,
        }
      }
      if (this.props.origin === 'end') {
        return { start: `${last}%`, end: '0%' }
      }
      return { start: '0%', end: `${100 - last}%` }
    }
    return { start: `${first}%`, end: `${100 - last}%` }
  }

  private rootStyle(): string {
    const decls: string[] = this.value.map(
      (value, index) => `--slider-thumb-offset-${index}:${this.thumbOffset(value)}`,
    )
    if (this.thumbSize) {
      decls.push(`--slider-thumb-width:${this.thumbSize.width}px`)
      decls.push(`--slider-thumb-height:${this.thumbSize.height}px`)
    }
    decls.push(
      `--slider-thumb-transform:${this.isVertical ? 'translateY(50%)' : this.isRtl ? 'translateX(50%)' : 'translateX(-50%)'}`,
    )
    const range = this.rangeOffsets()
    decls.push(`--slider-range-start:${range.start}`, `--slider-range-end:${range.end}`)
    return decls.join(';') + ';'
  }

  private rangeStyle(): string {
    if (this.isVertical) {
      return 'position:absolute;bottom:var(--slider-range-start);top:var(--slider-range-end);'
    }
    return this.isRtl
      ? 'position:absolute;right:var(--slider-range-start);left:var(--slider-range-end);'
      : 'position:absolute;left:var(--slider-range-start);right:var(--slider-range-end);'
  }

  private thumbStyle(index: number): string {
    const visibility =
      this.props.thumbAlignment === 'contain' && this.thumbSize == null ? 'hidden' : 'visible'
    const placement = this.isVertical ? 'bottom' : 'inset-inline-start'
    const zIndex = this.focusedIndex === index ? 'z-index:1;' : ''
    return `visibility:${visibility};position:absolute;transform:var(--slider-thumb-transform);${placement}:var(--slider-thumb-offset-${index});${zIndex}`
  }

  /* ----------------------------------------------------------------- dom */

  private getEl(suffix: string): HTMLElement | null {
    return document.getElementById(`slider:${this.props.id}${suffix}`)
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): SliderApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const sharedData = () => ({
      'data-disabled': dataAttr(self.disabled),
      'data-orientation': self.props.orientation,
      'data-invalid': dataAttr(!!self.props.invalid),
      'data-dragging': dataAttr(self.state === 'dragging'),
      'data-focus': dataAttr(self.state === 'focus'),
    })
    return {
      get value() {
        return self.value
      },
      get dragging() {
        return self.state === 'dragging'
      },
      get focused() {
        return self.state === 'focus'
      },
      setValue(value: number[]) {
        self.setValueInternal(value.map((v, index) => self.constrainValue(v, index)))
        self.invokeOnChangeEnd()
      },
      getThumbValue(index: number) {
        return self.value[index]
      },
      setThumbValue(index: number, value: number) {
        const next = self.value.slice()
        next[index] = self.constrainValue(value, index)
        self.setValueInternal(next)
        self.invokeOnChangeEnd()
      },
      getThumbPercent(index: number) {
        return self.valuePercent(self.value[index]) / 100
      },
      getThumbMin(index: number) {
        return self.rangeAt(index).min
      },
      getThumbMax(index: number) {
        return self.rangeAt(index).max
      },
      increment(index?: number) {
        self.setValueInternal(self.stepValue(index ?? self.focusedIndex, 1))
        self.invokeOnChangeEnd()
      },
      decrement(index?: number) {
        self.setValueInternal(self.stepValue(index ?? self.focusedIndex, -1))
        self.invokeOnChangeEnd()
      },
      focus() {
        if (!self.interactive) return
        if (self.state === 'idle') {
          self.state = 'focus'
          self.setFocusedIndex(0)
          self.focusActiveThumb()
          self.notify()
        }
      },
      getRootProps() {
        return {
          'data-scope': 'slider',
          'data-part': 'root',
          ...sharedData(),
          id: `slider:${self.props.id}`,
          dir: self.props.dir,
          style: self.rootStyle(),
        }
      },
      getControlProps() {
        return {
          'data-scope': 'slider',
          'data-part': 'control',
          dir: self.props.dir,
          id: `slider:${self.props.id}:control`,
          ...sharedData(),
          style: 'touch-action:none;user-select:none;-webkit-user-select:none;position:relative;',
          onpointerdown(event: PointerEvent) {
            if (!self.interactive) return
            if (event.button !== 0) return
            if (event.ctrlKey || event.altKey || event.metaKey) return
            const point = { x: event.clientX, y: event.clientY }
            // POINTER_DOWN: pick the closest thumb, jump it to the pointer
            const pointValue = self.getPointValue(point)
            if (pointValue != null) {
              self.setFocusedIndex(self.getClosestIndex(pointValue))
              self.thumbDragStartValue = self.value.slice()
              self.setPointerValue(point)
            }
            self.startDragging()
            event.preventDefault()
            event.stopPropagation()
          },
        }
      },
      getTrackProps() {
        return {
          'data-scope': 'slider',
          'data-part': 'track',
          dir: self.props.dir,
          id: `slider:${self.props.id}:track`,
          ...sharedData(),
          style: 'position:relative;',
        }
      },
      getRangeProps() {
        return {
          id: `slider:${self.props.id}:range`,
          'data-scope': 'slider',
          'data-part': 'range',
          dir: self.props.dir,
          ...sharedData(),
          style: self.rangeStyle(),
        }
      },
      getThumbProps(props: { index?: number }) {
        const index = props.index ?? 0
        const range = self.rangeAt(index)
        const ariaLabel = self.props['aria-label']
        const ariaLabelledBy = self.props['aria-labelledby']
        const valueText = self.props.getAriaValueText?.({ value: self.value[index], index })
        return {
          'data-scope': 'slider',
          'data-part': 'thumb',
          dir: self.props.dir,
          'data-index': index,
          id: `slider:${self.props.id}:thumb:${index}`,
          'data-disabled': dataAttr(self.disabled),
          'data-orientation': self.props.orientation,
          'data-focus': dataAttr(self.state === 'focus' && self.focusedIndex === index),
          'data-dragging': dataAttr(self.state === 'dragging' && self.focusedIndex === index),
          draggable: false,
          'aria-disabled': self.disabled ? true : undefined,
          'aria-label': Array.isArray(ariaLabel) ? ariaLabel[index] : ariaLabel,
          'aria-labelledby':
            (Array.isArray(ariaLabelledBy) ? ariaLabelledBy[index] : ariaLabelledBy) ??
            `slider:${self.props.id}:label`,
          'aria-orientation': self.props.orientation,
          'aria-valuemax': range.max,
          'aria-valuemin': range.min,
          'aria-valuenow': self.value[index],
          'aria-valuetext': valueText,
          role: 'slider',
          tabindex: self.disabled ? undefined : 0,
          style: self.thumbStyle(index),
          onpointerdown(event: PointerEvent) {
            if (!self.interactive) return
            if (event.button !== 0) return
            // THUMB_POINTER_DOWN: drag relative to the grab point
            const thumbEl = event.currentTarget as HTMLElement
            const rect = thumbEl.getBoundingClientRect()
            self.thumbDragOffset = {
              x: event.clientX - (rect.left + rect.width / 2),
              y: event.clientY - (rect.top + rect.height / 2),
            }
            self.setFocusedIndex(index)
            self.thumbDragStartValue = self.value.slice()
            self.startDragging()
            event.stopPropagation()
          },
          onblur() {
            if (!self.interactive) return
            if (self.state !== 'focus') return
            self.state = 'idle'
            self.setFocusedIndex(-1)
            self.notify()
          },
          onfocus() {
            if (!self.interactive) return
            if (self.state === 'idle') {
              self.state = 'focus'
              self.setFocusedIndex(index)
              self.notify()
            }
          },
          onkeydown(event: KeyboardEvent) {
            if (event.defaultPrevented) return
            if (!self.interactive) return
            if (self.state !== 'focus') return
            const isArrow = event.key.startsWith('Arrow')
            const isPage = event.key === 'PageUp' || event.key === 'PageDown'
            const step = isPage || (event.shiftKey && isArrow) ? self.props.largeStep : self.props.step
            const isHorizontal = !self.isVertical
            const key = getEventKey(event, {
              dir: self.props.dir,
              orientation: self.props.orientation,
            })
            const idx = self.focusedIndex
            const exec: Record<string, () => void> = {
              ArrowUp: () => {
                if (isHorizontal) return
                self.setValueInternal(self.stepValue(idx, 1, step))
                self.invokeOnChangeEnd()
              },
              ArrowDown: () => {
                if (isHorizontal) return
                self.setValueInternal(self.stepValue(idx, -1, step))
                self.invokeOnChangeEnd()
              },
              ArrowLeft: () => {
                if (self.isVertical) return
                self.setValueInternal(self.stepValue(idx, -1, step))
                self.invokeOnChangeEnd()
              },
              ArrowRight: () => {
                if (self.isVertical) return
                self.setValueInternal(self.stepValue(idx, 1, step))
                self.invokeOnChangeEnd()
              },
              PageUp: () => {
                self.setValueInternal(self.stepValue(idx, 1, step))
                self.invokeOnChangeEnd()
              },
              PageDown: () => {
                self.setValueInternal(self.stepValue(idx, -1, step))
                self.invokeOnChangeEnd()
              },
              Home: () => {
                const next = self.value.slice()
                next[idx] = self.rangeAt(idx).min
                self.setValueInternal(next)
                self.invokeOnChangeEnd()
              },
              End: () => {
                const next = self.value.slice()
                next[idx] = self.rangeAt(idx).max
                self.setValueInternal(next)
                self.invokeOnChangeEnd()
              },
            }
            const handler = exec[key]
            if (handler) {
              handler()
              event.preventDefault()
              event.stopPropagation()
            }
          },
        }
      },
      getHiddenInputProps(props: { index?: number; name?: string }) {
        const index = props.index ?? 0
        const name =
          props.name ??
          (self.props.name ? self.props.name + (self.value.length > 1 ? '[]' : '') : undefined)
        return {
          name,
          form: self.props.form,
          type: 'text',
          hidden: true,
          value: self.value[index],
          id: `slider:${self.props.id}:input:${index}`,
        }
      },
    }
  }
}

export const createNativeSliderBehavior = (): NativeSliderBehavior => new NativeSliderBehavior()
