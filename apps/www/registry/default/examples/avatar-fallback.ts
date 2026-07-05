import { customElement } from 'aurelia'
import { UiAvatar, UiAvatarImage, UiAvatarFallback } from '@/registry/default/ui/avatar'

const TEMPLATE = `
<div class="flex items-center gap-3">
  <ui-avatar>
    <ui-avatar-image src="https://invalid.example/broken.png" alt="Broken image"></ui-avatar-image>
    <ui-avatar-fallback>FB</ui-avatar-fallback>
  </ui-avatar>
  <ui-avatar>
    <ui-avatar-fallback>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </ui-avatar-fallback>
  </ui-avatar>
</div>
`

@customElement({
  name: 'avatar-fallback-demo',
  template: TEMPLATE,
  dependencies: [UiAvatar, UiAvatarImage, UiAvatarFallback],
})
export class AvatarFallbackDemo {}
