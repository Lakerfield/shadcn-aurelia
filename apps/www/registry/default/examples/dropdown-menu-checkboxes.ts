import { customElement } from 'aurelia'
import {
  UiDropdownMenu,
  UiDropdownMenuTrigger,
  UiDropdownMenuContent,
  UiDropdownMenuCheckboxItem,
  UiDropdownMenuLabel,
  UiDropdownMenuSeparator,
} from '@/registry/default/ui/dropdown-menu'
import { buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-dropdown-menu>
  <ui-dropdown-menu-trigger class="\${triggerClasses}">Open</ui-dropdown-menu-trigger>
  <ui-dropdown-menu-content class="w-56">
    <ui-dropdown-menu-label>Appearance</ui-dropdown-menu-label>
    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
    <ui-dropdown-menu-checkbox-item checked.two-way="statusBar">Status Bar</ui-dropdown-menu-checkbox-item>
    <ui-dropdown-menu-checkbox-item checked.two-way="activityBar" disabled.bind="true">Activity Bar</ui-dropdown-menu-checkbox-item>
    <ui-dropdown-menu-checkbox-item checked.two-way="panel">Panel</ui-dropdown-menu-checkbox-item>
  </ui-dropdown-menu-content>
</ui-dropdown-menu>
<p class="text-muted-foreground mt-4 text-sm">
  Status bar: \${statusBar} · Activity bar: \${activityBar} · Panel: \${panel}
</p>
`

@customElement({
  name: 'dropdown-menu-checkboxes',
  template: TEMPLATE,
  dependencies: [
    UiDropdownMenu,
    UiDropdownMenuTrigger,
    UiDropdownMenuContent,
    UiDropdownMenuCheckboxItem,
    UiDropdownMenuLabel,
    UiDropdownMenuSeparator,
  ],
})
export class DropdownMenuCheckboxes {
  triggerClasses = buttonVariants({ variant: 'outline' })
  statusBar = true
  activityBar = false
  panel = false
}
