import { customElement } from 'aurelia'
import { UiAspectRatio } from '@/registry/default/ui/aspect-ratio'

const TEMPLATE = `
<div class="grid w-full max-w-sm grid-cols-2 gap-4">
  <ui-aspect-ratio ratio="1" class="bg-muted flex items-center justify-center rounded-lg">
    <span class="text-foreground text-sm">1 : 1</span>
  </ui-aspect-ratio>
  <ui-aspect-ratio ratio="4/3" class="bg-muted flex items-center justify-center rounded-lg">
    <span class="text-foreground text-sm">4 : 3</span>
  </ui-aspect-ratio>
</div>
`

@customElement({ name: 'aspect-ratio-square', template: TEMPLATE, dependencies: [UiAspectRatio] })
export class AspectRatioSquare {}
