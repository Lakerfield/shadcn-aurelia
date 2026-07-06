import { customElement } from 'aurelia'
import { UiPopover, UiPopoverTrigger, UiPopoverContent } from '@/registry/default/ui/popover'
import { buttonVariants } from '@/registry/default/ui/button'
import { UiInput } from '@/registry/default/ui/input'
import { UiLabel } from '@/registry/default/ui/label'

const TEMPLATE = `
<ui-popover>
  <ui-popover-trigger class="\${triggerClasses}">Open popover</ui-popover-trigger>
  <ui-popover-content>
    <div class="grid gap-4">
      <div class="space-y-1">
        <p class="leading-none font-medium">Dimensions</p>
        <p class="text-muted-foreground text-sm">Set the dimensions for the layer.</p>
      </div>
      <div class="grid grid-cols-2 items-center gap-2">
        <ui-label for="popover-demo-width">Width</ui-label>
        <ui-input id="popover-demo-width" value="100%" class="h-8"></ui-input>
      </div>
    </div>
  </ui-popover-content>
</ui-popover>
`

@customElement({
  name: 'popover-demo',
  template: TEMPLATE,
  dependencies: [UiPopover, UiPopoverTrigger, UiPopoverContent, UiInput, UiLabel],
})
export class PopoverDemo {
  triggerClasses = buttonVariants({ variant: 'outline' })
}
