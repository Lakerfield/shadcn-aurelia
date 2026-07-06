/**
 * ui-accordion family — Zag accordion behind the facade.
 * Trigger is wrapped in an <h3> per the WAI-ARIA accordion pattern.
 *
 *   <ui-accordion collapsible.bind="true">
 *     <ui-accordion-item value="a">
 *       <ui-accordion-trigger>Title</ui-accordion-trigger>
 *       <ui-accordion-content>Body</ui-accordion-content>
 *     </ui-accordion-item>
 *   </ui-accordion>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createAccordionBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type AccordionApi,
  type BehaviorSource,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export const accordionContext = createContext<UiAccordion>()

function itemValueOf(host: HTMLElement): string {
  return host.closest('[data-slot="accordion-item"]')?.getAttribute('data-value') ?? ''
}

@customElement({ name: 'ui-accordion', template: '<au-slot></au-slot>' })
export class UiAccordion implements BehaviorSource<AccordionApi> {
  /** Open item values. */
  @bindable({ mode: BindingMode.twoWay }) value: string[] = []
  @bindable() type: 'single' | 'multiple' = 'single'
  @bindable() collapsible = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createAccordionBehavior()
  private sync: ControlledSync<string[]> | null = null
  private disposeRoot: (() => void) | null = null

  get api(): AccordionApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    accordionContext.set(this.host, this)
    this.sync = createControlledSync<string[]>({
      host: this.host,
      eventName: 'value-change',
      setMachineValue: (v) => this.behavior.api?.setValue(v),
      setBindable: (v) => (this.value = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('accordion'),
      defaultValue: this.value,
      multiple: this.type === 'multiple',
      collapsible: this.collapsible,
      onValueChange: (d: { value: string[] }) => this.sync?.fromMachine(d.value),
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'accordion')
    this.host.className = cn('block', author)
  }

  attached(): void {
    this.behavior.start()
    this.disposeRoot = bindPart(this.behavior, this.host, (api) => api.getRootProps())
  }

  valueChanged(v: string[]): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.disposeRoot?.()
    this.behavior.stop()
    accordionContext.delete(this.host)
  }
}

@customElement({ name: 'ui-accordion-item', template: '<au-slot></au-slot>' })
export class UiAccordionItem {
  @bindable() value = ''
  @bindable() disabled = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'accordion-item')
    this.host.setAttribute('data-value', this.value)
    this.host.className = cn('block border-b last:border-b-0', author)
  }

  attached(): void {
    const accordion = accordionContext.get(this.host)
    if (accordion) {
      this.dispose = bindPart(accordion, this.host, (api) =>
        api.getItemProps({ value: this.value, disabled: this.disabled || undefined }),
      )
    }
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const TRIGGER_TEMPLATE = `
<h3 class="flex">
  <button ref="btn" type="button" class.bind="classes" data-slot="accordion-trigger">
    <au-slot></au-slot>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         class="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200">
      <path d="m6 9 6 6 6-6"></path>
    </svg>
  </button>
</h3>
`

@customElement({ name: 'ui-accordion-trigger', template: TRIGGER_TEMPLATE })
export class UiAccordionTrigger {
  btn!: HTMLButtonElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(
      'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
      this.authorClasses,
    )
  }

  attached(): void {
    const accordion = accordionContext.get(this.host)
    if (!accordion) {
      console.warn('[ui-accordion-trigger] No parent <ui-accordion> found')
      return
    }
    const value = itemValueOf(this.host)
    this.dispose = bindPart(accordion, this.btn, (api) => api.getItemTriggerProps({ value }))
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const CONTENT_TEMPLATE = `
<div class="pt-0 pb-4"><au-slot></au-slot></div>
`

@customElement({ name: 'ui-accordion-content', template: CONTENT_TEMPLATE })
export class UiAccordionContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'accordion-content')
    this.host.className = cn(
      'block overflow-hidden text-sm data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up',
      author,
    )
  }

  attached(): void {
    const accordion = accordionContext.get(this.host)
    if (accordion) {
      const value = itemValueOf(this.host)
      this.dispose = bindPart(accordion, this.host, (api) => api.getItemContentProps({ value }))
    }
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}
