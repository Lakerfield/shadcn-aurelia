import { customElement } from 'aurelia'
import {
  UiDialog,
  UiDialogTrigger,
  UiDialogContent,
  UiDialogHeader,
  UiDialogFooter,
  UiDialogTitle,
  UiDialogDescription,
} from '@/registry/default/ui/dialog'
import { UiAlertDialogAction, UiAlertDialogCancel } from '@/registry/default/ui/alert-dialog'
import { buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex flex-col items-center gap-3">
  <ui-dialog role="alertdialog">
    <ui-dialog-trigger class="\${triggerClasses}">Delete 3 items</ui-dialog-trigger>
    <ui-dialog-content show-close.bind="false">
      <ui-dialog-header>
        <ui-dialog-title>Delete 3 items?</ui-dialog-title>
        <ui-dialog-description>The items will be moved to the trash.</ui-dialog-description>
      </ui-dialog-header>
      <ui-dialog-footer>
        <ui-alert-dialog-cancel>Keep them</ui-alert-dialog-cancel>
        <ui-alert-dialog-action class="\${destructiveClasses}" click.trigger="deleted = deleted + 3">
          Delete
        </ui-alert-dialog-action>
      </ui-dialog-footer>
    </ui-dialog-content>
  </ui-dialog>
  <p class="text-muted-foreground text-sm">Deleted so far: \${deleted}</p>
</div>
`

@customElement({
  name: 'alert-dialog-destructive',
  template: TEMPLATE,
  dependencies: [
    UiDialog,
    UiDialogTrigger,
    UiDialogContent,
    UiDialogHeader,
    UiDialogFooter,
    UiDialogTitle,
    UiDialogDescription,
    UiAlertDialogAction,
    UiAlertDialogCancel,
  ],
})
export class AlertDialogDestructive {
  deleted = 0
  triggerClasses = buttonVariants({ variant: 'destructive' })
  destructiveClasses = buttonVariants({ variant: 'destructive' })
}
