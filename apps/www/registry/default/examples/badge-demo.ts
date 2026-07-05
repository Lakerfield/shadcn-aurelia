import { customElement } from 'aurelia'
import { UiBadge } from '@/registry/default/ui/badge'

const TEMPLATE = `
<div class="flex flex-wrap items-center gap-2">
  <ui-badge>Badge</ui-badge>
  <ui-badge variant="secondary">Secondary</ui-badge>
  <ui-badge variant="destructive">Destructive</ui-badge>
  <ui-badge variant="outline">Outline</ui-badge>
</div>
`

@customElement({ name: 'badge-demo', template: TEMPLATE, dependencies: [UiBadge] })
export class BadgeDemo {}
