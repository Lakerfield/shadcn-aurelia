import { customElement } from 'aurelia'
import { UiSeparator } from '@/registry/default/ui/separator'

const TEMPLATE = `
<div class="w-full max-w-xs">
  <div class="space-y-1">
    <p class="text-sm leading-none font-medium">shadcn-aurelia</p>
    <p class="text-muted-foreground text-sm">The component library for Aurelia 2.</p>
  </div>
  <ui-separator class="my-4"></ui-separator>
  <div class="flex h-5 items-center space-x-4 text-sm">
    <div>Blog</div>
    <ui-separator orientation="vertical"></ui-separator>
    <div>Docs</div>
    <ui-separator orientation="vertical"></ui-separator>
    <div>Source</div>
  </div>
</div>
`

@customElement({ name: 'separator-demo', template: TEMPLATE, dependencies: [UiSeparator] })
export class SeparatorDemo {}
