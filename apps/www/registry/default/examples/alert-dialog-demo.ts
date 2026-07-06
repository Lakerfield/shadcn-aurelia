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
<ui-dialog role="alertdialog">
  <ui-dialog-trigger class="\${triggerClasses}">Delete account</ui-dialog-trigger>
  <ui-dialog-content show-close.bind="false">
    <ui-dialog-header>
      <ui-dialog-title>Are you absolutely sure?</ui-dialog-title>
      <ui-dialog-description>
        This action cannot be undone. This will permanently delete your account.
      </ui-dialog-description>
    </ui-dialog-header>
    <ui-dialog-footer>
      <ui-alert-dialog-cancel>Cancel</ui-alert-dialog-cancel>
      <ui-alert-dialog-action>Continue</ui-alert-dialog-action>
    </ui-dialog-footer>
  </ui-dialog-content>
</ui-dialog>
`

@customElement({
  name: 'alert-dialog-demo',
  template: TEMPLATE,
  dependencies: [UiDialog, UiDialogTrigger, UiDialogContent, UiDialogHeader, UiDialogFooter, UiDialogTitle, UiDialogDescription, UiAlertDialogAction, UiAlertDialogCancel],
})
export class AlertDialogDemo {
  triggerClasses = buttonVariants({ variant: 'outline' })
}
