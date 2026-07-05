import { customElement } from 'aurelia'
import { UiSkeleton } from '@/registry/default/ui/skeleton'

const TEMPLATE = `
<div class="flex w-full max-w-sm flex-col gap-3">
  <ui-skeleton class="h-[125px] w-full rounded-xl"></ui-skeleton>
  <div class="space-y-2">
    <ui-skeleton class="h-4 w-full"></ui-skeleton>
    <ui-skeleton class="h-4 w-4/5"></ui-skeleton>
  </div>
</div>
`

@customElement({ name: 'skeleton-card', template: TEMPLATE, dependencies: [UiSkeleton] })
export class SkeletonCard {}
