import { customElement } from 'aurelia'
import {
  UiDropdownMenu,
  UiDropdownMenuTrigger,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuGroup,
  UiDropdownMenuLabel,
  UiDropdownMenuSeparator,
  UiDropdownMenuShortcut,
  UiDropdownMenuSub,
  UiDropdownMenuSubTrigger,
  UiDropdownMenuSubContent,
} from '@/registry/default/ui/dropdown-menu'
import { buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-dropdown-menu placement="bottom-start">
  <ui-dropdown-menu-trigger class="\${triggerClasses}">Open</ui-dropdown-menu-trigger>
  <ui-dropdown-menu-content class="w-56">
    <ui-dropdown-menu-label>My Account</ui-dropdown-menu-label>
    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
    <ui-dropdown-menu-group>
      <ui-dropdown-menu-item click.trigger="log('profile')">
        Profile
        <ui-dropdown-menu-shortcut>⇧⌘P</ui-dropdown-menu-shortcut>
      </ui-dropdown-menu-item>
      <ui-dropdown-menu-item click.trigger="log('billing')">
        Billing
        <ui-dropdown-menu-shortcut>⌘B</ui-dropdown-menu-shortcut>
      </ui-dropdown-menu-item>
      <ui-dropdown-menu-item click.trigger="log('settings')">
        Settings
        <ui-dropdown-menu-shortcut>⌘S</ui-dropdown-menu-shortcut>
      </ui-dropdown-menu-item>
    </ui-dropdown-menu-group>
    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
    <ui-dropdown-menu-group>
      <ui-dropdown-menu-item>Team</ui-dropdown-menu-item>
      <ui-dropdown-menu-sub>
        <ui-dropdown-menu-sub-trigger>Invite users</ui-dropdown-menu-sub-trigger>
        <ui-dropdown-menu-sub-content>
          <ui-dropdown-menu-item click.trigger="log('email')">Email</ui-dropdown-menu-item>
          <ui-dropdown-menu-item click.trigger="log('message')">Message</ui-dropdown-menu-item>
          <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
          <ui-dropdown-menu-item click.trigger="log('more')">More…</ui-dropdown-menu-item>
        </ui-dropdown-menu-sub-content>
      </ui-dropdown-menu-sub>
    </ui-dropdown-menu-group>
    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
    <ui-dropdown-menu-item disabled.bind="true">API (soon)</ui-dropdown-menu-item>
    <ui-dropdown-menu-item variant="destructive" click.trigger="log('logout')">
      Log out
      <ui-dropdown-menu-shortcut>⇧⌘Q</ui-dropdown-menu-shortcut>
    </ui-dropdown-menu-item>
  </ui-dropdown-menu-content>
</ui-dropdown-menu>
`

@customElement({
  name: 'dropdown-menu-demo',
  template: TEMPLATE,
  dependencies: [
    UiDropdownMenu,
    UiDropdownMenuTrigger,
    UiDropdownMenuContent,
    UiDropdownMenuItem,
    UiDropdownMenuGroup,
    UiDropdownMenuLabel,
    UiDropdownMenuSeparator,
    UiDropdownMenuShortcut,
    UiDropdownMenuSub,
    UiDropdownMenuSubTrigger,
    UiDropdownMenuSubContent,
  ],
})
export class DropdownMenuDemo {
  triggerClasses = buttonVariants({ variant: 'outline' })

  log(action: string): void {
    console.log('[dropdown-menu-demo]', action)
  }
}
