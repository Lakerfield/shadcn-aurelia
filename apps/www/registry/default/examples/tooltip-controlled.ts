import { customElement } from 'aurelia'
import { UiTooltip, UiTooltipTrigger, UiTooltipContent } from '@/registry/default/ui/tooltip'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex items-center gap-3">
  <ui-tooltip open.two-way="isOpen">
    <ui-tooltip-trigger>
      <ui-button variant="outline">Hover or toggle</ui-button>
    </ui-tooltip-trigger>
    <ui-tooltip-content>Two-way bound tooltip</ui-tooltip-content>
  </ui-tooltip>
  <ui-button variant="ghost" size="sm" click.trigger="isOpen = !isOpen">Toggle (\${isOpen})</ui-button>
</div>
`

@customElement({
  name: 'tooltip-controlled',
  template: TEMPLATE,
  dependencies: [UiTooltip, UiTooltipTrigger, UiTooltipContent, UiButton],
})
export class TooltipControlled {
  isOpen = false
}
