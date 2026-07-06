/**
 * ui-dialog family — Zag dialog behind the facade. Content (backdrop +
 * positioner + panel) is portaled to <body>; Zag handles focus trap, Esc and
 * outside-press dismissal, and scroll locking.
 *
 *   <ui-dialog>
 *     <ui-dialog-trigger class="...">Open</ui-dialog-trigger>
 *     <ui-dialog-content>
 *       <ui-dialog-header>
 *         <ui-dialog-title>Title</ui-dialog-title>
 *         <ui-dialog-description>…</ui-dialog-description>
 *       </ui-dialog-header>
 *       …
 *       <ui-dialog-footer>…</ui-dialog-footer>
 *     </ui-dialog-content>
 *   </ui-dialog>
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createDialogBehavior,
  createControlledSync,
  createContext,
  createId,
  bindPart,
  type ControlledSync,
  type DialogApi,
  type BehaviorSource,
  resolveDirection,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export const dialogContext = createContext<UiDialog>()

@customElement({ name: 'ui-dialog', template: '<au-slot></au-slot>' })
export class UiDialog implements BehaviorSource<DialogApi> {
  @bindable({ mode: BindingMode.twoWay }) open = false
  /** 'dialog' | 'alertdialog' — alertdialog also disables outside-press dismissal. */
  @bindable() role: 'dialog' | 'alertdialog' = 'dialog'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createDialogBehavior()
  private sync: ControlledSync<boolean> | null = null

  get api(): DialogApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    dialogContext.set(this.host, this)
    this.sync = createControlledSync<boolean>({
      host: this.host,
      eventName: 'open-change',
      setMachineValue: (v) => this.behavior.api?.setOpen(v),
      setBindable: (v) => (this.open = v),
    })
    this.behavior.init({
      dir: resolveDirection(this.host),
      id: createId('dialog'),
      defaultOpen: this.open,
      role: this.role,
      closeOnInteractOutside: this.role !== 'alertdialog',
      onOpenChange: (d: { open: boolean }) => this.sync?.fromMachine(d.open),
    })
  }

  attached(): void {
    this.behavior.start()
  }

  openChanged(v: boolean): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.behavior.stop()
    dialogContext.delete(this.host)
  }
}

const TRIGGER_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="dialog-trigger">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-dialog-trigger', template: TRIGGER_TEMPLATE })
export class UiDialogTrigger {
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
    return cn(this.authorClasses)
  }

  attached(): void {
    const dialog = dialogContext.get(this.host)
    if (!dialog) {
      console.warn('[ui-dialog-trigger] No parent <ui-dialog> found')
      return
    }
    this.dispose = bindPart(dialog, this.btn, (api) => api.getTriggerProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const CONTENT_TEMPLATE = `
<div ref="backdropEl" data-slot="dialog-overlay" class="fixed inset-0 z-50 bg-black/50"></div>
<div ref="positionerEl" data-slot="dialog-positioner" class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div ref="contentEl" data-slot="dialog-content" class.bind="classes">
    <au-slot></au-slot>
    <button if.bind="showClose" ref="closeEl" type="button" data-slot="dialog-close"
            class="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
      </svg>
      <span class="sr-only">Close</span>
    </button>
  </div>
</div>
`

@customElement({ name: 'ui-dialog-content', template: CONTENT_TEMPLATE })
export class UiDialogContent {
  @bindable() showClose = true

  backdropEl!: HTMLDivElement
  positionerEl!: HTMLDivElement
  contentEl!: HTMLDivElement
  closeEl?: HTMLButtonElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(
      'bg-background relative grid w-full max-w-lg gap-4 rounded-lg border p-6 shadow-lg duration-200',
      this.authorClasses,
    )
  }

  attached(): void {
    // resolve context BEFORE the portal moves the host out of the tree
    const dialog = dialogContext.get(this.host)
    document.body.appendChild(this.host)
    if (!dialog) {
      console.warn('[ui-dialog-content] No parent <ui-dialog> found')
      return
    }
    this.disposers = [
      bindPart(dialog, this.backdropEl, (api) => api.getBackdropProps()),
      bindPart(dialog, this.positionerEl, (api) => api.getPositionerProps()),
      bindPart(dialog, this.contentEl, (api) => api.getContentProps()),
    ]
    if (this.closeEl) {
      this.disposers.push(bindPart(dialog, this.closeEl, (api) => api.getCloseTriggerProps()))
    }
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}

function defineHostPart(name: string, slot: string, classes: string, getProps?: keyof DialogApi) {
  @customElement({ name, template: '<au-slot></au-slot>' })
  class HostPart {
    readonly host: HTMLElement = resolve(INode) as HTMLElement
    dispose: (() => void) | null = null

    bound(): void {
      const author = this.host.getAttribute('class') ?? ''
      this.host.setAttribute('data-slot', slot)
      this.host.className = cn(classes, author)
    }

    attached(): void {
      if (!getProps) return
      const dialog = dialogContext.get(this.host)
      if (dialog) {
        this.dispose = bindPart(dialog, this.host, (api) =>
          (api[getProps] as () => Record<string, unknown>)(),
        )
      }
    }

    detaching(): void {
      this.dispose?.()
      this.dispose = null
    }
  }
  return HostPart
}

export const UiDialogHeader = defineHostPart(
  'ui-dialog-header',
  'dialog-header',
  'flex flex-col gap-2 text-center sm:text-left',
)

export const UiDialogFooter = defineHostPart(
  'ui-dialog-footer',
  'dialog-footer',
  'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
)

export const UiDialogTitle = defineHostPart(
  'ui-dialog-title',
  'dialog-title',
  'block text-lg leading-none font-semibold',
  'getTitleProps',
)

export const UiDialogDescription = defineHostPart(
  'ui-dialog-description',
  'dialog-description',
  'text-muted-foreground block text-sm',
  'getDescriptionProps',
)
