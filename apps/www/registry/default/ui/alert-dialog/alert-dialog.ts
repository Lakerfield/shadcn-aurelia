/**
 * ui-alert-dialog-* — action/cancel buttons for an alert dialog. Compose with
 * the dialog root in alertdialog mode (no outside-press dismissal, no X):
 *
 *   <ui-dialog role="alertdialog">
 *     <ui-dialog-trigger>…</ui-dialog-trigger>
 *     <ui-dialog-content show-close.bind="false">
 *       …
 *       <ui-dialog-footer>
 *         <ui-alert-dialog-cancel>Cancel</ui-alert-dialog-cancel>
 *         <ui-alert-dialog-action click.trigger="confirm()">Continue</ui-alert-dialog-action>
 *       </ui-dialog-footer>
 *     </ui-dialog-content>
 *   </ui-dialog>
 */
import { customElement, INode, resolve } from 'aurelia'
import { bindPart } from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'
import { buttonVariants } from '@/registry/default/ui/button'
import { dialogContext } from '@/registry/default/ui/dialog'

const ACTION_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="alert-dialog-action"
        click.trigger="close()">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-alert-dialog-action', template: ACTION_TEMPLATE })
export class UiAlertDialogAction {
  btn!: HTMLButtonElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(buttonVariants(), this.authorClasses)
  }

  close(): void {
    dialogContext.get(this.host)?.api?.setOpen(false)
  }
}

const CANCEL_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="alert-dialog-cancel">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-alert-dialog-cancel', template: CANCEL_TEMPLATE })
export class UiAlertDialogCancel {
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
    return cn(buttonVariants({ variant: 'outline' }), this.authorClasses)
  }

  attached(): void {
    const dialog = dialogContext.get(this.host)
    if (dialog) this.dispose = bindPart(dialog, this.btn, (api) => api.getCloseTriggerProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}
