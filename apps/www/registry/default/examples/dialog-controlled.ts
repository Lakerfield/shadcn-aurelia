import { customElement } from 'aurelia'
import {
  UiDialog,
  UiDialogTrigger,
  UiDialogContent,
  UiDialogHeader,
  UiDialogTitle,
  UiDialogDescription,
} from '@/registry/default/ui/dialog'
import { UiButton, buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex flex-col items-center gap-3">
  <ui-dialog open.two-way="isOpen">
    <ui-dialog-trigger class="\${triggerClasses}">Open dialog</ui-dialog-trigger>
    <ui-dialog-content>
      <ui-dialog-header>
        <ui-dialog-title>Controlled dialog</ui-dialog-title>
        <ui-dialog-description>State is two-way bound; Esc or the X closes it.</ui-dialog-description>
      </ui-dialog-header>
    </ui-dialog-content>
  </ui-dialog>
  <ui-button variant="ghost" size="sm" click.trigger="isOpen = !isOpen">
    Toggle from outside (open: \${isOpen})
  </ui-button>
</div>
`

@customElement({
  name: 'dialog-controlled',
  template: TEMPLATE,
  dependencies: [
    UiDialog,
    UiDialogTrigger,
    UiDialogContent,
    UiDialogHeader,
    UiDialogTitle,
    UiDialogDescription,
    UiButton,
  ],
})
export class DialogControlled {
  isOpen = false
  triggerClasses = buttonVariants({ variant: 'outline' })
}
