import { customElement } from 'aurelia'
import { UiSeparator } from '@/registry/default/ui/separator'

const TEMPLATE = `
<div class="w-full max-w-xs text-sm">
  <p>Section one — announcements.</p>
  <ui-separator decorative.bind="false" class="my-4"></ui-separator>
  <p>Section two — unrelated content, so the separator is semantic (role="separator").</p>
</div>
`

@customElement({ name: 'separator-semantic', template: TEMPLATE, dependencies: [UiSeparator] })
export class SeparatorSemantic {}
