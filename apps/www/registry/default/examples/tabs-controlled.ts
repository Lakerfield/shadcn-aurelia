import { customElement } from 'aurelia'
import { UiTabs, UiTabsList, UiTabsTrigger, UiTabsContent } from '@/registry/default/ui/tabs'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex w-full max-w-sm flex-col items-start gap-3">
  <ui-tabs value.two-way="tab" class="w-full">
    <ui-tabs-list>
      <ui-tabs-trigger value="overview">Overview</ui-tabs-trigger>
      <ui-tabs-trigger value="analytics">Analytics</ui-tabs-trigger>
      <ui-tabs-trigger value="reports" disabled.bind="true">Reports</ui-tabs-trigger>
    </ui-tabs-list>
    <ui-tabs-content value="overview" class="text-sm">Overview panel</ui-tabs-content>
    <ui-tabs-content value="analytics" class="text-sm">Analytics panel</ui-tabs-content>
    <ui-tabs-content value="reports" class="text-sm">Reports panel</ui-tabs-content>
  </ui-tabs>
  <ui-button variant="outline" size="sm" click.trigger="tab = 'analytics'">Jump to analytics</ui-button>
</div>
`

@customElement({
  name: 'tabs-controlled',
  template: TEMPLATE,
  dependencies: [UiTabs, UiTabsList, UiTabsTrigger, UiTabsContent, UiButton],
})
export class TabsControlled {
  tab = 'overview'
}
