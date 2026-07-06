import { customElement } from 'aurelia'
import { UiProgress } from '@/registry/default/ui/progress'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex w-full max-w-sm flex-col items-start gap-3">
  <ui-progress value.bind="value"></ui-progress>
  <div class="flex items-center gap-2">
    <ui-button variant="outline" size="sm" click.trigger="value = Math.max(0, value - 10)">-10</ui-button>
    <ui-button variant="outline" size="sm" click.trigger="value = Math.min(100, value + 10)">+10</ui-button>
    <span class="text-muted-foreground text-sm">\${value}%</span>
  </div>
</div>
`

@customElement({ name: 'progress-live', template: TEMPLATE, dependencies: [UiProgress, UiButton] })
export class ProgressLive {
  value = 30
  Math = Math
}
