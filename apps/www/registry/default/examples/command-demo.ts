import { customElement } from 'aurelia'
import {
  UiCommand,
  UiCommandInput,
  UiCommandList,
  UiCommandEmpty,
  UiCommandGroup,
  UiCommandItem,
  UiCommandSeparator,
  UiCommandShortcut,
} from '@/registry/default/ui/command'

const TEMPLATE = `
<div class="w-full max-w-[450px]">
  <ui-command class="rounded-lg border shadow-md">
    <ui-command-input placeholder="Type a command or search…"></ui-command-input>
    <ui-command-list>
      <ui-command-empty>No results found.</ui-command-empty>
      <ui-command-group heading="Suggestions">
        <ui-command-item value="calendar" select.trigger="run('calendar')">Calendar</ui-command-item>
        <ui-command-item value="search-emoji" select.trigger="run('emoji')">Search Emoji</ui-command-item>
        <ui-command-item value="calculator" disabled.bind="true">Calculator</ui-command-item>
      </ui-command-group>
      <ui-command-separator></ui-command-separator>
      <ui-command-group heading="Settings">
        <ui-command-item value="profile" select.trigger="run('profile')">
          Profile
          <ui-command-shortcut>⌘P</ui-command-shortcut>
        </ui-command-item>
        <ui-command-item value="billing" select.trigger="run('billing')">
          Billing
          <ui-command-shortcut>⌘B</ui-command-shortcut>
        </ui-command-item>
        <ui-command-item value="settings" select.trigger="run('settings')">
          Settings
          <ui-command-shortcut>⌘S</ui-command-shortcut>
        </ui-command-item>
      </ui-command-group>
    </ui-command-list>
  </ui-command>
  <p class="text-muted-foreground mt-4 text-sm">Last action: \${lastAction || '—'}</p>
</div>
`

@customElement({
  name: 'command-demo',
  template: TEMPLATE,
  dependencies: [
    UiCommand,
    UiCommandInput,
    UiCommandList,
    UiCommandEmpty,
    UiCommandGroup,
    UiCommandItem,
    UiCommandSeparator,
    UiCommandShortcut,
  ],
})
export class CommandDemo {
  lastAction = ''

  run(action: string): void {
    this.lastAction = action
  }
}
