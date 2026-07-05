import { customElement } from 'aurelia'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex flex-wrap items-center gap-2">
  <ui-button>Default</ui-button>
  <ui-button variant="secondary">Secondary</ui-button>
  <ui-button variant="destructive">Destructive</ui-button>
  <ui-button variant="outline">Outline</ui-button>
  <ui-button variant="ghost">Ghost</ui-button>
  <ui-button variant="link">Link</ui-button>
  <ui-button size="sm" variant="outline">Small</ui-button>
  <ui-button size="lg" variant="outline">Large</ui-button>
  <ui-button size="icon" variant="outline" label="Settings">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  </ui-button>
  <ui-button disabled.bind="true">Disabled</ui-button>
  <ui-button class="w-full">Full width (author class)</ui-button>
</div>
`

@customElement({ name: 'button-variants', template: TEMPLATE, dependencies: [UiButton] })
export class ButtonVariantsExample {}
