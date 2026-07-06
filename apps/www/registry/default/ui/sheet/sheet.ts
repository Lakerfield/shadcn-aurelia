/**
 * ui-sheet-content — side-anchored dialog panel. Compose with the dialog root:
 *
 *   <ui-dialog>
 *     <ui-dialog-trigger>Open</ui-dialog-trigger>
 *     <ui-sheet-content side="right">…</ui-sheet-content>
 *   </ui-dialog>
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { bindPart } from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'
import { dialogContext } from '@/registry/default/ui/dialog'

export const sheetVariants = cva(
  'bg-background fixed z-50 flex flex-col gap-4 border shadow-lg outline-none',
  {
    variants: {
      side: {
        right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
        top: 'inset-x-0 top-0 h-auto border-b',
        bottom: 'inset-x-0 bottom-0 h-auto border-t',
      },
    },
    defaultVariants: { side: 'right' },
  },
)

export type SheetVariants = VariantProps<typeof sheetVariants>

const TEMPLATE = `
<div ref="backdropEl" data-slot="sheet-overlay" class="fixed inset-0 z-50 bg-black/50"></div>
<div ref="positionerEl" data-slot="sheet-positioner" class="fixed inset-0 z-50">
  <div ref="contentEl" data-slot="sheet-content" class.bind="classes">
    <au-slot></au-slot>
    <button ref="closeEl" type="button" data-slot="sheet-close"
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

@customElement({ name: 'ui-sheet-content', template: TEMPLATE })
export class UiSheetContent {
  @bindable() side: SheetVariants['side'] = 'right'

  backdropEl!: HTMLDivElement
  positionerEl!: HTMLDivElement
  contentEl!: HTMLDivElement
  closeEl!: HTMLButtonElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(sheetVariants({ side: this.side }), 'p-6', this.authorClasses)
  }

  attached(): void {
    const dialog = dialogContext.get(this.host)
    document.body.appendChild(this.host)
    if (!dialog) {
      console.warn('[ui-sheet-content] No parent <ui-dialog> found')
      return
    }
    this.disposers = [
      bindPart(dialog, this.backdropEl, (api) => api.getBackdropProps()),
      bindPart(dialog, this.positionerEl, (api) => api.getPositionerProps()),
      bindPart(dialog, this.contentEl, (api) => api.getContentProps()),
      bindPart(dialog, this.closeEl, (api) => api.getCloseTriggerProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}
