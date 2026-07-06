/**
 * ui-sonner — sonner-style toasts on the Zag toast engine.
 *
 * Three pieces: the module-level `toaster` store (imperative API — call
 * `toaster.create({ title })` / `.success()` / `.error()` from anywhere),
 * the <ui-sonner> region (place once in your app; it portals to <body>),
 * and one child machine per visible toast.
 *
 *   <ui-sonner></ui-sonner>
 *   …
 *   toaster.create({ title: 'Saved', description: 'Your changes are safe.' })
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import {
  createToastStore,
  createToastGroupBehavior,
  createToastBehavior,
  createContext,
  createId,
  bindPart,
  resolveDirection,
  type ToastStore,
  type ToastGroupApi,
  type ToastOptions,
  type BehaviorSource,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export const toaster: ToastStore = createToastStore({
  placement: 'bottom-end',
  overlap: true,
  gap: 14,
})

export interface SonnerOwner extends BehaviorSource<ToastGroupApi> {
  readonly service: unknown
}

export const sonnerContext = createContext<SonnerOwner>()

const X_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`

const TOAST_TEMPLATE = `
<div ref="rootEl" data-slot="sonner-toast" class.bind="classes">
  <span ref="ghostBeforeEl" aria-hidden="true"></span>
  <div class="grid flex-1 gap-0.5">
    <div ref="titleEl" data-slot="sonner-title" class="text-sm font-medium"></div>
    <div ref="descEl" data-slot="sonner-description" class="text-muted-foreground text-sm"></div>
  </div>
  <button ref="closeEl" type="button" data-slot="sonner-close"
          class="text-foreground/50 hover:text-foreground shrink-0 rounded-md p-1 transition-colors" aria-label="Dismiss">${X_ICON}</button>
  <span ref="ghostAfterEl" aria-hidden="true"></span>
</div>
`

@customElement({ name: 'ui-sonner-toast', template: TOAST_TEMPLATE })
export class UiSonnerToast {
  @bindable() options: ToastOptions | null = null
  @bindable() index = 0

  rootEl!: HTMLDivElement
  titleEl!: HTMLDivElement
  descEl!: HTMLDivElement
  closeEl!: HTMLButtonElement
  ghostBeforeEl!: HTMLSpanElement
  ghostAfterEl!: HTMLSpanElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createToastBehavior()
  private disposers: Array<() => void> = []
  private started = false

  created(): void {
    this.host.style.display = 'contents'
  }

  get classes(): string {
    return cn(
      // sonner look + Zag's stacking contract (--x/--y/--scale/--z-index/--height/--opacity)
      'bg-background text-foreground pointer-events-auto relative flex w-[356px] items-center gap-3 rounded-lg border p-4 shadow-lg',
      '[translate:var(--x)_var(--y)] [scale:var(--scale)] [z-index:var(--z-index)] [height:var(--height)] [opacity:var(--opacity)]',
      '[will-change:translate,opacity,scale] [transition:translate_400ms_cubic-bezier(0.21,1.02,0.73,1),scale_400ms,opacity_400ms,height_400ms]',
      'data-[state=closed]:[transition:translate_400ms,scale_400ms,opacity_200ms]',
    )
  }

  attached(): void {
    const sonner = sonnerContext.get(this.host)
    if (!sonner || !this.options) {
      console.warn('[ui-sonner-toast] No parent <ui-sonner> found')
      return
    }
    this.behavior.init({
      ...this.options,
      parent: sonner.service,
      index: this.index,
    })
    this.behavior.start()
    this.started = true
    const syncText = () => {
      const api = this.behavior.api
      if (!api) return
      this.titleEl.textContent = String(api.title ?? '')
      this.titleEl.hidden = !api.title
      this.descEl.textContent = String(api.description ?? '')
      this.descEl.hidden = !api.description
      this.rootEl.setAttribute('data-type', api.type)
    }
    syncText()
    this.disposers = [
      this.behavior.subscribe(syncText),
      bindPart(this.behavior, this.rootEl, (api) => api.getRootProps()),
      bindPart(this.behavior, this.titleEl, (api) => api.getTitleProps()),
      bindPart(this.behavior, this.descEl, (api) => api.getDescriptionProps()),
      bindPart(this.behavior, this.closeEl, (api) => api.getCloseTriggerProps()),
      bindPart(this.behavior, this.ghostBeforeEl, (api) => api.getGhostBeforeProps()),
      bindPart(this.behavior, this.ghostAfterEl, (api) => api.getGhostAfterProps()),
    ]
  }

  indexChanged(v: number): void {
    if (this.started) this.behavior.updateProps({ index: v })
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    if (this.started) this.behavior.stop()
    this.started = false
  }
}
const REGION_TEMPLATE = `
<div ref="regionEl" data-slot="sonner-region">
  <ui-sonner-toast repeat.for="t of toasts" options.bind="t" index.bind="$index"></ui-sonner-toast>
</div>
`

@customElement({ name: 'ui-sonner', template: REGION_TEMPLATE, dependencies: [UiSonnerToast] })
export class UiSonner implements SonnerOwner {
  /** Pass a custom store to run multiple independent regions. */
  @bindable() store: ToastStore = toaster

  regionEl!: HTMLDivElement
  toasts: ToastOptions[] = []

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createToastGroupBehavior()
  private disposers: Array<() => void> = []

  get api(): ToastGroupApi | null {
    return this.behavior.api
  }

  get service(): unknown {
    return this.behavior.service
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    sonnerContext.set(this.host, this)
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('sonner'),
      store: this.store,
    })
  }

  attached(): void {
    document.body.appendChild(this.host)
    this.behavior.start()
    const syncToasts = () => {
      this.toasts = [...(this.behavior.api?.getToasts() ?? [])]
    }
    syncToasts()
    this.disposers = [
      this.behavior.subscribe(syncToasts),
      bindPart(this.behavior, this.regionEl, (api) => api.getGroupProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
    this.behavior.stop()
    sonnerContext.delete(this.host)
  }
}

