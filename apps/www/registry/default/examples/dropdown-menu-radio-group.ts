import { customElement } from 'aurelia'
import {
  UiDropdownMenu,
  UiDropdownMenuTrigger,
  UiDropdownMenuContent,
  UiDropdownMenuRadioGroup,
  UiDropdownMenuRadioItem,
  UiDropdownMenuLabel,
  UiDropdownMenuSeparator,
} from '@/registry/default/ui/dropdown-menu'
import { buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-dropdown-menu>
  <ui-dropdown-menu-trigger class="\${triggerClasses}">Open</ui-dropdown-menu-trigger>
  <ui-dropdown-menu-content class="w-56">
    <ui-dropdown-menu-label>Panel Position</ui-dropdown-menu-label>
    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
    <ui-dropdown-menu-radio-group value.two-way="position">
      <ui-dropdown-menu-radio-item value="top">Top</ui-dropdown-menu-radio-item>
      <ui-dropdown-menu-radio-item value="bottom">Bottom</ui-dropdown-menu-radio-item>
      <ui-dropdown-menu-radio-item value="right">Right</ui-dropdown-menu-radio-item>
    </ui-dropdown-menu-radio-group>
  </ui-dropdown-menu-content>
</ui-dropdown-menu>
<p class="text-muted-foreground mt-4 text-sm">Position: \${position}</p>
`

@customElement({
  name: 'dropdown-menu-radio-group',
  template: TEMPLATE,
  dependencies: [
    UiDropdownMenu,
    UiDropdownMenuTrigger,
    UiDropdownMenuContent,
    UiDropdownMenuRadioGroup,
    UiDropdownMenuRadioItem,
    UiDropdownMenuLabel,
    UiDropdownMenuSeparator,
  ],
})
export class DropdownMenuRadioGroupDemo {
  triggerClasses = buttonVariants({ variant: 'outline' })
  position = 'bottom'
}
