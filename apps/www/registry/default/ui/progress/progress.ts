/**
 * ui-progress — Zag progress behind the facade. Single-element (host = root).
 *   <ui-progress value.bind="66"></ui-progress>
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { createProgressBehavior, createId, bindPart } from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

const TEMPLATE = `
<div ref="rangeEl" data-slot="progress-indicator" class="bg-primary h-full w-full flex-1 transition-all"></div>
`

@customElement({ name: 'ui-progress', template: TEMPLATE })
export class UiProgress {
  @bindable() value = 0
  @bindable() max = 100

  rangeEl!: HTMLDivElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createProgressBehavior()
  private disposers: Array<() => void> = []

  binding(): void {
    this.behavior.init({
      id: createId('progress'),
      defaultValue: Number(this.value),
      max: Number(this.max),
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'progress')
    this.host.className = cn(
      'bg-primary/20 relative block h-2 w-full overflow-hidden rounded-full',
      author,
    )
  }

  attached(): void {
    this.behavior.start()
    this.disposers = [
      bindPart(this.behavior, this.host, (api) => api.getRootProps()),
      bindPart(this.behavior, this.rangeEl, (api) => api.getRangeProps()),
    ]
  }

  valueChanged(v: number): void {
    this.behavior.api?.setValue(Number(v))
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    this.behavior.stop()
  }
}
