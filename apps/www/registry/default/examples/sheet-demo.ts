import { customElement } from 'aurelia'
import { UiDialog, UiDialogTrigger, UiDialogHeader, UiDialogTitle, UiDialogDescription } from '@/registry/default/ui/dialog'
import { UiSheetContent } from '@/registry/default/ui/sheet'
import { buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-dialog>
  <ui-dialog-trigger class="\${triggerClasses}">Open sheet</ui-dialog-trigger>
  <ui-sheet-content side="right">
    <ui-dialog-header>
      <ui-dialog-title>Edit profile</ui-dialog-title>
      <ui-dialog-description>Make changes to your profile here.</ui-dialog-description>
    </ui-dialog-header>
    <p class="text-sm">Sheet body content…</p>
  </ui-sheet-content>
</ui-dialog>
`

@customElement({
  name: 'sheet-demo',
  template: TEMPLATE,
  dependencies: [UiDialog, UiDialogTrigger, UiSheetContent, UiDialogHeader, UiDialogTitle, UiDialogDescription],
})
export class SheetDemo {
  triggerClasses = buttonVariants({ variant: 'outline' })
}
