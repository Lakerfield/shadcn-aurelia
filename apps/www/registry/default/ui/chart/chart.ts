/**
 * ui-chart-container — shadcn's chart theming contract on chart.js.
 *
 *   chartConfig: ChartConfig = {
 *     desktop: { label: 'Desktop', color: 'var(--chart-1)' },
 *     mobile: { label: 'Mobile', color: 'var(--chart-2)' },
 *   }
 *
 *   <ui-chart-container type="bar" config.bind="chartConfig" data.bind="chartData"
 *                       label="Monthly visitors" class="min-h-[200px] w-full">
 *   </ui-chart-container>
 *
 * The container exposes each config color as a `--color-<key>` CSS variable;
 * datasets reference them ('var(--color-desktop)') and every var() is
 * resolved to a concrete color before it reaches the canvas. Legend, tooltip,
 * grid and ticks pick up the theme automatically and re-resolve when the
 * dark class on <html> flips.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import {
  createChartEngine,
  type ChartEngine,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export interface ChartConfigEntry {
  label?: string
  color?: string
}

export type ChartConfig = Record<string, ChartConfigEntry>

const TEMPLATE = `
<canvas ref="canvasEl" data-slot="chart-canvas" role="img" aria-label.bind="label"></canvas>
`

const CARTESIAN_TYPES = new Set<string>(['bar', 'line', 'scatter', 'bubble'])

@customElement({ name: 'ui-chart-container', template: TEMPLATE })
export class UiChartContainer {
  @bindable() type: ChartType = 'bar'
  @bindable() config: ChartConfig = {}
  @bindable() data: ChartData | null = null
  @bindable() options: ChartOptions | null = null
  /** Accessible name for the rendered canvas. */
  @bindable() label = 'Chart'

  canvasEl!: HTMLCanvasElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private engine: ChartEngine | null = null
  private themeObserver: MutationObserver | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'chart')
    this.host.className = cn(
      'relative flex aspect-video justify-center overflow-hidden text-xs',
      author,
    )
  }

  attached(): void {
    this.applyConfigVars()
    this.build()
    // colors are resolved to concrete values; re-resolve on light/dark switch
    this.themeObserver = new MutationObserver(() => this.rebuild())
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }

  private applyConfigVars(): void {
    for (const [key, entry] of Object.entries(this.config ?? {})) {
      if (entry.color) this.host.style.setProperty(`--color-${key}`, entry.color)
    }
  }

  /** Replace 'var(--x)' strings (recursively) with the computed color. */
  private resolveVars<T>(value: T, css: CSSStyleDeclaration): T {
    if (typeof value === 'string' && value.startsWith('var(')) {
      const name = value.slice(4, -1).trim().split(',')[0].trim()
      const resolved = css.getPropertyValue(name).trim()
      return (resolved || value) as unknown as T
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.resolveVars(v, css)) as unknown as T
    }
    if (value !== null && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = this.resolveVars(v, css)
      }
      return out as unknown as T
    }
    return value
  }

  private build(): void {
    if (!this.data) return
    const css = getComputedStyle(this.host)
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
    const foreground = color('--muted-foreground', '#71717b')
    const border = color('--border', '#e4e4e7')
    const defaults: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      color: foreground,
      ...(CARTESIAN_TYPES.has(this.type)
        ? {
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: foreground },
                border: { color: border },
              },
              y: {
                grid: { color: border },
                ticks: { color: foreground },
                border: { display: false },
              },
            },
          }
        : {}),
    }
    this.engine = createChartEngine(this.canvasEl, {
      type: this.type,
      data: this.resolveVars(this.data, css),
      options: { ...defaults, ...(this.options ? this.resolveVars(this.options, css) : {}) },
    })
  }

  private rebuild(): void {
    this.engine?.destroy()
    this.engine = null
    this.applyConfigVars()
    this.build()
  }

  dataChanged(): void {
    if (this.engine) this.rebuild()
  }

  typeChanged(): void {
    if (this.engine) this.rebuild()
  }

  configChanged(): void {
    if (this.engine) this.rebuild()
  }

  detaching(): void {
    this.themeObserver?.disconnect()
    this.themeObserver = null
    this.engine?.destroy()
    this.engine = null
  }
}
