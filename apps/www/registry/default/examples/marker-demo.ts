import { customElement } from 'aurelia'
import { UiMarker, UiMarkerIcon, UiMarkerContent } from '@/registry/default/ui/marker'

const CALENDAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>`

const TEMPLATE = `
<div class="flex w-full max-w-md flex-col gap-8">
  <ui-marker>
    <ui-marker-icon>${CALENDAR_ICON}</ui-marker-icon>
    <ui-marker-content>Today at 9:41 AM</ui-marker-content>
  </ui-marker>
  <ui-marker variant="separator">
    <ui-marker-content>Yesterday</ui-marker-content>
  </ui-marker>
  <ui-marker variant="border">
    <ui-marker-content>New messages since <a href="#">last visit</a></ui-marker-content>
  </ui-marker>
</div>
`

@customElement({
  name: 'marker-demo',
  template: TEMPLATE,
  dependencies: [UiMarker, UiMarkerIcon, UiMarkerContent],
})
export class MarkerDemo {}
