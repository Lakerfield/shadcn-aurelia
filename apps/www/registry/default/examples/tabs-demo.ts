import { customElement } from 'aurelia'
import { UiTabs, UiTabsList, UiTabsTrigger, UiTabsContent } from '@/registry/default/ui/tabs'
import {
  UiCard,
  UiCardHeader,
  UiCardTitle,
  UiCardDescription,
  UiCardContent,
} from '@/registry/default/ui/card'

const TEMPLATE = `
<ui-tabs value="account" class="w-full max-w-sm">
  <ui-tabs-list class="w-full">
    <ui-tabs-trigger value="account">Account</ui-tabs-trigger>
    <ui-tabs-trigger value="password">Password</ui-tabs-trigger>
  </ui-tabs-list>
  <ui-tabs-content value="account">
    <ui-card>
      <ui-card-header>
        <ui-card-title>Account</ui-card-title>
        <ui-card-description>Make changes to your account here.</ui-card-description>
      </ui-card-header>
      <ui-card-content>
        <p class="text-sm">Account settings…</p>
      </ui-card-content>
    </ui-card>
  </ui-tabs-content>
  <ui-tabs-content value="password">
    <ui-card>
      <ui-card-header>
        <ui-card-title>Password</ui-card-title>
        <ui-card-description>Change your password here.</ui-card-description>
      </ui-card-header>
      <ui-card-content>
        <p class="text-sm">Password settings…</p>
      </ui-card-content>
    </ui-card>
  </ui-tabs-content>
</ui-tabs>
`

@customElement({
  name: 'tabs-demo',
  template: TEMPLATE,
  dependencies: [UiTabs, UiTabsList, UiTabsTrigger, UiTabsContent, UiCard, UiCardHeader, UiCardTitle, UiCardDescription, UiCardContent],
})
export class TabsDemo {}
