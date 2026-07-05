import { customElement } from 'aurelia'
import { UiTextarea } from '@/registry/default/ui/textarea'
import { UiLabel } from '@/registry/default/ui/label'

const TEMPLATE = `
<div class="grid w-full max-w-sm gap-2">
  <ui-label for="textarea-message">Your message</ui-label>
  <ui-textarea id="textarea-message" placeholder="Type your message here." rows="5"></ui-textarea>
  <p class="text-muted-foreground text-sm">Your message will be copied to the support team.</p>
</div>
`

@customElement({ name: 'textarea-label', template: TEMPLATE, dependencies: [UiTextarea, UiLabel] })
export class TextareaLabel {}
