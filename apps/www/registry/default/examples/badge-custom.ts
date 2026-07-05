import { customElement } from 'aurelia'
import { UiBadge } from '@/registry/default/ui/badge'

const TEMPLATE = `
<div class="flex flex-wrap items-center gap-2">
  <ui-badge class="bg-blue-600 text-white">Custom color</ui-badge>
  <ui-badge variant="outline" class="rounded-full">Pill</ui-badge>
  <ui-badge variant="secondary">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6 9 17l-5-5"></path>
    </svg>
    Verified
  </ui-badge>
</div>
`

@customElement({ name: 'badge-custom', template: TEMPLATE, dependencies: [UiBadge] })
export class BadgeCustom {}
