import { customElement } from 'aurelia'
import { UiSkeleton } from '@/registry/default/ui/skeleton'

const TEMPLATE = `
<div class="flex items-center gap-4">
  <ui-skeleton class="size-10 rounded-full"></ui-skeleton>
  <div class="space-y-2">
    <ui-skeleton class="h-4 w-[200px]"></ui-skeleton>
    <ui-skeleton class="h-4 w-[150px]"></ui-skeleton>
  </div>
</div>
`

@customElement({ name: 'skeleton-demo', template: TEMPLATE, dependencies: [UiSkeleton] })
export class SkeletonDemo {}
