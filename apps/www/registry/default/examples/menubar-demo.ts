import { customElement } from 'aurelia'
import {
  UiMenubar,
  UiMenubarMenu,
  UiMenubarTrigger,
  UiMenubarContent,
} from '@/registry/default/ui/menubar'
import {
  UiDropdownMenuItem,
  UiDropdownMenuCheckboxItem,
  UiDropdownMenuSeparator,
  UiDropdownMenuShortcut,
  UiDropdownMenuSub,
  UiDropdownMenuSubTrigger,
  UiDropdownMenuSubContent,
} from '@/registry/default/ui/dropdown-menu'

const TEMPLATE = `
<ui-menubar>
  <ui-menubar-menu>
    <ui-menubar-trigger>File</ui-menubar-trigger>
    <ui-menubar-content>
      <ui-dropdown-menu-item>
        New Tab
        <ui-dropdown-menu-shortcut>⌘T</ui-dropdown-menu-shortcut>
      </ui-dropdown-menu-item>
      <ui-dropdown-menu-item>
        New Window
        <ui-dropdown-menu-shortcut>⌘N</ui-dropdown-menu-shortcut>
      </ui-dropdown-menu-item>
      <ui-dropdown-menu-item disabled.bind="true">New Incognito Window</ui-dropdown-menu-item>
      <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
      <ui-dropdown-menu-sub>
        <ui-dropdown-menu-sub-trigger>Share</ui-dropdown-menu-sub-trigger>
        <ui-dropdown-menu-sub-content>
          <ui-dropdown-menu-item>Email link</ui-dropdown-menu-item>
          <ui-dropdown-menu-item>Messages</ui-dropdown-menu-item>
          <ui-dropdown-menu-item>Notes</ui-dropdown-menu-item>
        </ui-dropdown-menu-sub-content>
      </ui-dropdown-menu-sub>
      <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
      <ui-dropdown-menu-item>
        Print…
        <ui-dropdown-menu-shortcut>⌘P</ui-dropdown-menu-shortcut>
      </ui-dropdown-menu-item>
    </ui-menubar-content>
  </ui-menubar-menu>
  <ui-menubar-menu>
    <ui-menubar-trigger>Edit</ui-menubar-trigger>
    <ui-menubar-content>
      <ui-dropdown-menu-item>
        Undo
        <ui-dropdown-menu-shortcut>⌘Z</ui-dropdown-menu-shortcut>
      </ui-dropdown-menu-item>
      <ui-dropdown-menu-item>
        Redo
        <ui-dropdown-menu-shortcut>⇧⌘Z</ui-dropdown-menu-shortcut>
      </ui-dropdown-menu-item>
      <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
      <ui-dropdown-menu-item>Cut</ui-dropdown-menu-item>
      <ui-dropdown-menu-item>Copy</ui-dropdown-menu-item>
      <ui-dropdown-menu-item>Paste</ui-dropdown-menu-item>
    </ui-menubar-content>
  </ui-menubar-menu>
  <ui-menubar-menu>
    <ui-menubar-trigger>View</ui-menubar-trigger>
    <ui-menubar-content>
      <ui-dropdown-menu-checkbox-item checked.two-way="alwaysShowBookmarks">Always Show Bookmarks Bar</ui-dropdown-menu-checkbox-item>
      <ui-dropdown-menu-checkbox-item checked.two-way="alwaysShowFullUrls">Always Show Full URLs</ui-dropdown-menu-checkbox-item>
      <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
      <ui-dropdown-menu-item>
        Reload
        <ui-dropdown-menu-shortcut>⌘R</ui-dropdown-menu-shortcut>
      </ui-dropdown-menu-item>
      <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
      <ui-dropdown-menu-item>Toggle Fullscreen</ui-dropdown-menu-item>
    </ui-menubar-content>
  </ui-menubar-menu>
</ui-menubar>
`

@customElement({
  name: 'menubar-demo',
  template: TEMPLATE,
  dependencies: [
    UiMenubar,
    UiMenubarMenu,
    UiMenubarTrigger,
    UiMenubarContent,
    UiDropdownMenuItem,
    UiDropdownMenuCheckboxItem,
    UiDropdownMenuSeparator,
    UiDropdownMenuShortcut,
    UiDropdownMenuSub,
    UiDropdownMenuSubTrigger,
    UiDropdownMenuSubContent,
  ],
})
export class MenubarDemo {
  alwaysShowBookmarks = false
  alwaysShowFullUrls = false
}
