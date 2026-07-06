import { customElement } from 'aurelia'
import {
  UiCollapsible,
  UiCollapsibleTrigger,
  UiCollapsibleContent,
} from '@/registry/default/ui/collapsible'
import { buttonVariants } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-collapsible class="flex w-full max-w-sm flex-col gap-2">
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm font-semibold">@aurelia starred 3 repositories</p>
    <ui-collapsible-trigger class="\${triggerClasses}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path>
      </svg>
      <span class="sr-only">Toggle</span>
    </ui-collapsible-trigger>
  </div>
  <div class="rounded-md border px-4 py-2 font-mono text-sm">aurelia/aurelia</div>
  <ui-collapsible-content class="flex flex-col gap-2">
    <div class="rounded-md border px-4 py-2 font-mono text-sm">aurelia/skills</div>
    <div class="rounded-md border px-4 py-2 font-mono text-sm">shadcn-aurelia</div>
  </ui-collapsible-content>
</ui-collapsible>
`

@customElement({
  name: 'collapsible-demo',
  template: TEMPLATE,
  dependencies: [UiCollapsible, UiCollapsibleTrigger, UiCollapsibleContent],
})
export class CollapsibleDemo {
  triggerClasses = buttonVariants({ variant: 'ghost', size: 'icon' })
}
