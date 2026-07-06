import { customElement } from 'aurelia'
import {
  UiContextMenu,
  UiContextMenuTrigger,
  UiContextMenuContent,
} from '@/registry/default/ui/context-menu'
import {
  UiDropdownMenuItem,
  UiDropdownMenuCheckboxItem,
  UiDropdownMenuRadioGroup,
  UiDropdownMenuRadioItem,
  UiDropdownMenuLabel,
  UiDropdownMenuSeparator,
  UiDropdownMenuShortcut,
} from '@/registry/default/ui/dropdown-menu'

const TEMPLATE = `
<ui-context-menu>
  <ui-context-menu-trigger
    class="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm select-none">
    Right click here
  </ui-context-menu-trigger>
  <ui-context-menu-content class="w-52">
    <ui-dropdown-menu-item inset.bind="true">
      Back
      <ui-dropdown-menu-shortcut>⌘[</ui-dropdown-menu-shortcut>
    </ui-dropdown-menu-item>
    <ui-dropdown-menu-item inset.bind="true" disabled.bind="true">
      Forward
      <ui-dropdown-menu-shortcut>⌘]</ui-dropdown-menu-shortcut>
    </ui-dropdown-menu-item>
    <ui-dropdown-menu-item inset.bind="true">
      Reload
      <ui-dropdown-menu-shortcut>⌘R</ui-dropdown-menu-shortcut>
    </ui-dropdown-menu-item>
    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
    <ui-dropdown-menu-checkbox-item checked.two-way="showBookmarks">Show Bookmarks</ui-dropdown-menu-checkbox-item>
    <ui-dropdown-menu-checkbox-item checked.two-way="showFullUrls">Show Full URLs</ui-dropdown-menu-checkbox-item>
    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
    <ui-dropdown-menu-radio-group value.two-way="person">
      <ui-dropdown-menu-label inset.bind="true">People</ui-dropdown-menu-label>
      <ui-dropdown-menu-radio-item value="pedro">Pedro Duarte</ui-dropdown-menu-radio-item>
      <ui-dropdown-menu-radio-item value="colm">Colm Tuite</ui-dropdown-menu-radio-item>
    </ui-dropdown-menu-radio-group>
  </ui-context-menu-content>
</ui-context-menu>
`

@customElement({
  name: 'context-menu-demo',
  template: TEMPLATE,
  dependencies: [
    UiContextMenu,
    UiContextMenuTrigger,
    UiContextMenuContent,
    UiDropdownMenuItem,
    UiDropdownMenuCheckboxItem,
    UiDropdownMenuRadioGroup,
    UiDropdownMenuRadioItem,
    UiDropdownMenuLabel,
    UiDropdownMenuSeparator,
    UiDropdownMenuShortcut,
  ],
})
export class ContextMenuDemo {
  showBookmarks = true
  showFullUrls = false
  person = 'pedro'
}
