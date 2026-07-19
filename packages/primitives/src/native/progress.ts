/**
 * Native progress engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/progress` behind the facade: the prop bags
 * emit the exact attribute, ARIA, style and event contract the Zag connect
 * produced (keys pre-normalized the way `@zag-js/vanilla` would), verified by
 * the dual-engine suite in `test/progress.spec.ts`.
 *
 * Model (Zag's single `idle` state): a nullable value — `null` renders the
 * indeterminate state; otherwise `--percent` on the root and a width/height
 * percentage on the range track the progress.
 *
 * Not ported (unused by the registry component): the circular variant
 * (`getCircleProps` family), `getViewProps`, per-part `ids` overrides, and
 * custom `translations`/`formatOptions` beyond the percent formatter.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type ProgressProps = {
  /** Unique machine id — element ids derive from it (`progress-{id}`). */
  id: string
  dir?: 'ltr' | 'rtl'
  orientation?: 'horizontal' | 'vertical'
  min?: number
  max?: number
  /** `null` = indeterminate. Defaults to the midpoint like Zag. */
  defaultValue?: number | null
  locale?: string
  onValueChange?: (details: { value: number | null }) => void
}

export interface ProgressApi {
  value: number | null
  valueAsString: string
  min: number
  max: number
  percent: number
  percentAsString: string
  indeterminate: boolean
  setValue(value: number | null): void
  setToMax(): void
  setToMin(): void
  getRootProps(): Record<string, unknown>
  getLabelProps(): Record<string, unknown>
  getValueTextProps(): Record<string, unknown>
  getTrackProps(): Record<string, unknown>
  getRangeProps(): Record<string, unknown>
}

interface ResolvedProgressProps extends ProgressProps {
  orientation: 'horizontal' | 'vertical'
  min: number
  max: number
}

export class NativeProgressBehavior implements BehaviorSource<ProgressApi> {
  api: ProgressApi | null = null

  private props!: ResolvedProgressProps
  private value: number | null = 0
  private formatter!: Intl.NumberFormat
  private readonly listeners = new Set<() => void>()
  private started = false

  init(props: ProgressProps): void {
    if (!props.id) throw new Error('[progress] `id` is required')
    const min = props.min ?? 0
    const max = props.max ?? 100
    this.props = { orientation: 'horizontal', ...props, min, max }
    this.value = props.defaultValue !== undefined ? props.defaultValue : min + (max - min) / 2
    this.formatter = new Intl.NumberFormat(props.locale, { style: 'percent' })
    this.validate()
  }

  updateProps(props: Partial<ProgressProps>): void {
    this.props = { ...this.props, ...props } as ResolvedProgressProps
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.api = this.buildApi()
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.api = null
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify(): void {
    this.listeners.forEach((l) => l())
  }

  /* ------------------------------------------------------------- machine */

  // Zag's validateContext, same error messages
  private validate(): void {
    const { min, max } = this.props
    const value = this.value
    if (value == null) return
    if (Number.isNaN(max)) {
      throw new Error(`[progress] The max value passed \`${max}\` is not a valid number`)
    }
    if (!(value <= max)) {
      throw new Error(`[progress] The value passed \`${value}\` exceeds the max value \`${max}\``)
    }
    if (!(value >= min)) {
      throw new Error(`[progress] The value passed \`${value}\` exceeds the min value \`${min}\``)
    }
  }

  private setValue(next: number | null): void {
    // Zag clamps to [0, max] — not [min, max]
    const value = next === null ? null : Math.max(0, Math.min(next, this.props.max))
    if (value === this.value) return
    this.value = value
    this.props.onValueChange?.({ value })
    this.notify()
  }

  private get percent(): number {
    if (this.value == null) return -1
    return ((this.value - this.props.min) / (this.props.max - this.props.min)) * 100
  }

  private get state(): 'indeterminate' | 'complete' | 'loading' {
    return this.value == null ? 'indeterminate' : this.value === this.props.max ? 'complete' : 'loading'
  }

  private get valueAsString(): string {
    if (this.value === null) return 'loading...'
    return this.formatter.format(this.percent / 100)
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): ProgressApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return {
      get value() {
        return self.value
      },
      get valueAsString() {
        return self.valueAsString
      },
      get min() {
        return self.props.min
      },
      get max() {
        return self.props.max
      },
      get percent() {
        return self.percent
      },
      get percentAsString() {
        return self.value == null ? '' : self.formatter.format(self.percent / 100)
      },
      get indeterminate() {
        return self.value == null
      },
      setValue(value: number | null) {
        self.setValue(value)
      },
      setToMax() {
        self.setValue(self.props.max)
      },
      setToMin() {
        self.setValue(self.props.min)
      },
      getRootProps() {
        return {
          dir: self.props.dir,
          'data-scope': 'progress',
          'data-part': 'root',
          id: `progress-${self.props.id}`,
          'data-max': self.props.max,
          'data-value': self.value ?? undefined,
          'data-state': self.state,
          'data-orientation': self.props.orientation,
          style: self.value == null ? '' : `--percent:${self.percent};`,
        }
      },
      getLabelProps() {
        return {
          dir: self.props.dir,
          id: `progress-${self.props.id}-label`,
          'data-scope': 'progress',
          'data-part': 'label',
          'data-orientation': self.props.orientation,
        }
      },
      getValueTextProps() {
        return {
          dir: self.props.dir,
          'aria-live': 'polite',
          'data-scope': 'progress',
          'data-part': 'value-text',
        }
      },
      getTrackProps() {
        return {
          dir: self.props.dir,
          id: `progress-${self.props.id}-track`,
          'data-scope': 'progress',
          'data-part': 'track',
          role: 'progressbar',
          'aria-label': self.valueAsString,
          'data-max': self.props.max,
          'aria-valuemin': self.props.min,
          'aria-valuemax': self.props.max,
          'aria-valuenow': self.value ?? undefined,
          'data-orientation': self.props.orientation,
          'data-state': self.state,
        }
      },
      getRangeProps() {
        const dimension = self.props.orientation === 'horizontal' ? 'width' : 'height'
        return {
          dir: self.props.dir,
          'data-scope': 'progress',
          'data-part': 'range',
          'data-orientation': self.props.orientation,
          'data-state': self.state,
          style: self.value == null ? '' : `${dimension}:${self.percent}%;`,
        }
      },
    }
  }
}

export const createNativeProgressBehavior = (): NativeProgressBehavior =>
  new NativeProgressBehavior()
