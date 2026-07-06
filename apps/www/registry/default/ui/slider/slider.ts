/**
 * ui-slider — Zag slider behind the facade. Thumbs (+ hidden inputs) are built
 * imperatively from the initial value array, so multi-thumb ranges just work:
 *   <ui-slider value.two-way="range" min="0" max="100" step="1"></ui-slider>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createSliderBehavior,
  createControlledSync,
  createId,
  bindPart,
  type ControlledSync,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

const THUMB_CLASSES =
  'border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50'

const TEMPLATE = `
<div ref="controlEl" data-slot="slider-control" class="relative flex w-full items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:flex-col">
  <div ref="trackEl" data-slot="slider-track"
       class="bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5">
    <div ref="rangeEl" data-slot="slider-range"
         class="bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"></div>
  </div>
</div>
`

@customElement({ name: 'ui-slider', template: TEMPLATE })
export class UiSlider {
  @bindable({ mode: BindingMode.twoWay }) value: number[] = [50]
  @bindable() min = 0
  @bindable() max = 100
  @bindable() step = 1
  @bindable() disabled = false
  /** Accessible name prefix for the thumbs (role=slider needs a name). */
  @bindable() label = 'Value'

  controlEl!: HTMLDivElement
  trackEl!: HTMLDivElement
  rangeEl!: HTMLDivElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createSliderBehavior()
  private sync: ControlledSync<number[]> | null = null
  private disposers: Array<() => void> = []

  binding(): void {
    this.sync = createControlledSync<number[]>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.behavior.api?.setValue(v),
      setBindable: (v) => (this.value = v),
    })
    this.behavior.init({
      id: createId('slider'),
      defaultValue: this.value.map(Number),
      // attribute-sourced bindables arrive as strings — coerce
      min: Number(this.min),
      max: Number(this.max),
      step: Number(this.step),
      disabled: this.disabled,
      // thumbs are created after machine start, so skip Zag's DOM measurement
      // (it would leave visibility:hidden); size-4 = 16px
      thumbSize: { width: 16, height: 16 },
      onValueChange: (d: { value: number[] }) => this.sync?.fromMachine(d.value),
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'slider')
    this.host.className = cn(
      'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
      author,
    )
  }

  attached(): void {
    this.behavior.start()
    this.disposers = [
      bindPart(this.behavior, this.host, (api) => api.getRootProps()),
      bindPart(this.behavior, this.controlEl, (api) => api.getControlProps()),
      bindPart(this.behavior, this.trackEl, (api) => api.getTrackProps()),
      bindPart(this.behavior, this.rangeEl, (api) => api.getRangeProps()),
    ]
    // one thumb (+ hidden input) per initial value
    this.value.forEach((_, index) => {
      const thumb = document.createElement('div')
      thumb.dataset.slot = 'slider-thumb'
      thumb.className = THUMB_CLASSES
      thumb.setAttribute('aria-label', this.value.length > 1 ? `${this.label} ${index + 1}` : this.label)
      const input = document.createElement('input')
      thumb.appendChild(input)
      this.controlEl.appendChild(thumb)
      this.disposers.push(
        bindPart(this.behavior, thumb, (api) => api.getThumbProps({ index })),
        bindPart(this.behavior, input, (api) => api.getHiddenInputProps({ index })),
      )
    })
  }

  valueChanged(v: number[]): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    this.behavior.stop()
  }
}
