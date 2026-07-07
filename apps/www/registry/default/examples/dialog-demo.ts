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
import { UiButton, buttonVariants } from '@/registry/default/ui/button'
import { UiInput } from '@/registry/default/ui/input'
import { UiLabel } from '@/registry/default/ui/label'

const TEMPLATE = `
<ui-dialog>
  <ui-dialog-trigger class="\${triggerClasses}">Edit profile</ui-dialog-trigger>
  <ui-dialog-content>
    <ui-dialog-header>
      <ui-dialog-title>Edit profile</ui-dialog-title>
      <ui-dialog-description>
        Make changes to your profile here. Click save when you're done.
      </ui-dialog-description>
    </ui-dialog-header>
    <div class="grid gap-4">
      <div class="grid gap-2">
        <ui-label for="dialog-demo-name">Name</ui-label>
        <ui-input id="dialog-demo-name" value.two-way="name"></ui-input>
      </div>
    </div>
    <ui-dialog-footer>
      <ui-button>Save changes</ui-button>
    </ui-dialog-footer>
  </ui-dialog-content>
</ui-dialog>
`

@customElement({
  name: 'dialog-demo',
  template: TEMPLATE,
  dependencies: [
    UiDialog,
    UiDialogTrigger,
    UiDialogContent,
    UiDialogHeader,
    UiDialogFooter,
    UiDialogTitle,
    UiDialogDescription,
    UiButton,
    UiInput,
    UiLabel,
  ],
})
export class DialogDemo {
  name = 'Ada Lovelace'
  triggerClasses = buttonVariants({ variant: 'outline' })
}
