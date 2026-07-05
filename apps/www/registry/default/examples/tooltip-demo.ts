/**
 * tooltip-demo — the default tooltip example rendered on the docs page.
 */
import { customElement } from 'aurelia'
import { UiTooltip, UiTooltipTrigger, UiTooltipContent } from '@/registry/default/ui/tooltip'

const TEMPLATE = `
<ui-tooltip>
  <ui-tooltip-trigger>
    <button class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
      Hover
    </button>
  </ui-tooltip-trigger>
  <ui-tooltip-content>
    Add to library
  </ui-tooltip-content>
</ui-tooltip>
`

@customElement({
  name: 'tooltip-demo',
  template: TEMPLATE,
  dependencies: [UiTooltip, UiTooltipTrigger, UiTooltipContent],
})
export class TooltipDemo {}
