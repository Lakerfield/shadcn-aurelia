import { customElement } from 'aurelia'
import { UiPopover, UiPopoverTrigger, UiPopoverContent } from '@/registry/default/ui/popover'
import { UiButton, buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex items-center gap-3">
  <ui-popover open.two-way="isOpen">
    <ui-popover-trigger class="\${triggerClasses}">Popover (\${isOpen ? 'open' : 'closed'})</ui-popover-trigger>
    <ui-popover-content class="w-56">
      <p class="text-sm">Dismiss with Esc or by clicking outside.</p>
    </ui-popover-content>
  </ui-popover>
  <ui-button variant="ghost" size="sm" click.trigger="isOpen = !isOpen">Toggle</ui-button>
</div>
`

@customElement({
  name: 'popover-controlled',
  template: TEMPLATE,
  dependencies: [UiPopover, UiPopoverTrigger, UiPopoverContent, UiButton],
})
export class PopoverControlled {
  isOpen = false
  triggerClasses = buttonVariants({ variant: 'outline' })
}
