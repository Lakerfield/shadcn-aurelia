import { customElement } from 'aurelia'
import { UiAvatar, UiAvatarImage, UiAvatarFallback } from '@/registry/default/ui/avatar'

const TEMPLATE = `
<div class="flex items-center gap-3">
  <ui-avatar>
    <ui-avatar-image src="https://github.com/shadcn.png" alt="@shadcn"></ui-avatar-image>
    <ui-avatar-fallback>CN</ui-avatar-fallback>
  </ui-avatar>
  <ui-avatar class="size-10 rounded-lg">
    <ui-avatar-image src="https://github.com/aurelia.png" alt="@aurelia"></ui-avatar-image>
    <ui-avatar-fallback class="rounded-lg">AU</ui-avatar-fallback>
  </ui-avatar>
</div>
`

@customElement({
  name: 'avatar-demo',
  template: TEMPLATE,
  dependencies: [UiAvatar, UiAvatarImage, UiAvatarFallback],
})
export class AvatarDemo {}
