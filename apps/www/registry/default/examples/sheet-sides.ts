import { customElement } from 'aurelia'
import { UiDialog, UiDialogTrigger, UiDialogHeader, UiDialogTitle } from '@/registry/default/ui/dialog'
import { UiSheetContent } from '@/registry/default/ui/sheet'
import { buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex flex-wrap items-center gap-2">
  <ui-dialog repeat.for="side of sides">
    <ui-dialog-trigger class="\${triggerClasses}">\${side}</ui-dialog-trigger>
    <ui-sheet-content side.bind="side">
      <ui-dialog-header>
        <ui-dialog-title>Sheet from \${side}</ui-dialog-title>
      </ui-dialog-header>
    </ui-sheet-content>
  </ui-dialog>
</div>
`

@customElement({
  name: 'sheet-sides',
  template: TEMPLATE,
  dependencies: [UiDialog, UiDialogTrigger, UiSheetContent, UiDialogHeader, UiDialogTitle],
})
export class SheetSides {
  sides = ['left', 'right', 'top', 'bottom']
  triggerClasses = buttonVariants({ variant: 'outline', size: 'sm' })
}
