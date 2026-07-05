import { customElement } from 'aurelia'
import { UiAspectRatio } from '@/registry/default/ui/aspect-ratio'

const TEMPLATE = `
<div class="w-full max-w-sm">
  <ui-aspect-ratio ratio="16/9" class="bg-muted rounded-lg">
    <img src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
         alt="Landscape photograph by Tobias Tullius"
         class="absolute inset-0 h-full w-full rounded-lg object-cover">
  </ui-aspect-ratio>
</div>
`

@customElement({ name: 'aspect-ratio-demo', template: TEMPLATE, dependencies: [UiAspectRatio] })
export class AspectRatioDemo {}
