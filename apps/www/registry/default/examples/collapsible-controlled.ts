import { customElement } from 'aurelia'
import {
  UiCollapsible,
  UiCollapsibleTrigger,
  UiCollapsibleContent,
} from '@/registry/default/ui/collapsible'
import { buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-collapsible open.two-way="isOpen" class="flex w-full max-w-sm flex-col items-start gap-2">
  <ui-collapsible-trigger class="\${triggerClasses}">
    \${isOpen ? 'Hide' : 'Show'} details
  </ui-collapsible-trigger>
  <ui-collapsible-content class="text-muted-foreground text-sm">
    These details are \${isOpen ? 'visible' : 'hidden'} — state is two-way bound.
  </ui-collapsible-content>
</ui-collapsible>
`

@customElement({
  name: 'collapsible-controlled',
  template: TEMPLATE,
  dependencies: [UiCollapsible, UiCollapsibleTrigger, UiCollapsibleContent],
})
export class CollapsibleControlled {
  isOpen = true
  triggerClasses = buttonVariants({ variant: 'outline', size: 'sm' })
}
