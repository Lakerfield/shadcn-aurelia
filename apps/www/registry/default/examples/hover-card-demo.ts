import { customElement } from 'aurelia'
import { UiHoverCard, UiHoverCardTrigger, UiHoverCardContent } from '@/registry/default/ui/hover-card'
import { UiAvatar, UiAvatarImage, UiAvatarFallback } from '@/registry/default/ui/avatar'

const TEMPLATE = `
<ui-hover-card>
  <ui-hover-card-trigger>
    <a href="https://github.com/aurelia" class="text-primary font-medium underline underline-offset-4">@aurelia</a>
  </ui-hover-card-trigger>
  <ui-hover-card-content>
    <div class="flex gap-4">
      <ui-avatar>
        <ui-avatar-image src="https://github.com/aurelia.png" alt="@aurelia"></ui-avatar-image>
        <ui-avatar-fallback>AU</ui-avatar-fallback>
      </ui-avatar>
      <div class="space-y-1">
        <p class="text-sm font-semibold">@aurelia</p>
        <p class="text-sm">The Aurelia JavaScript framework — created and maintained by the core team.</p>
      </div>
    </div>
  </ui-hover-card-content>
</ui-hover-card>
`

@customElement({
  name: 'hover-card-demo',
  template: TEMPLATE,
  dependencies: [UiHoverCard, UiHoverCardTrigger, UiHoverCardContent, UiAvatar, UiAvatarImage, UiAvatarFallback],
})
export class HoverCardDemo {}
