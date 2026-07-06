import { customElement } from 'aurelia'
import {
  UiSidebarProvider,
  UiSidebar,
  UiSidebarTrigger,
  UiSidebarInset,
  UiSidebarHeader,
  UiSidebarContent,
  UiSidebarGroup,
  UiSidebarGroupLabel,
  UiSidebarGroupContent,
  UiSidebarMenu,
  UiSidebarMenuItem,
  UiSidebarMenuButton,
} from '@/registry/default/ui/sidebar'

const HOME_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
const SEARCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>`
const SETTINGS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`

const TEMPLATE = `
<ui-sidebar-provider class="relative min-h-[420px] w-full overflow-hidden rounded-lg border">
  <ui-sidebar collapsible="icon" class="absolute h-full">
    <ui-sidebar-header>
      <div class="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold group-data-[collapsible=icon]:hidden">Acme Inc</div>
    </ui-sidebar-header>
    <ui-sidebar-content>
      <ui-sidebar-group>
        <ui-sidebar-group-label>Navigation</ui-sidebar-group-label>
        <ui-sidebar-group-content>
          <ui-sidebar-menu>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button tooltip="Home" is-active.bind="true">${HOME_ICON}<span>Home</span></ui-sidebar-menu-button>
            </ui-sidebar-menu-item>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button tooltip="Search">${SEARCH_ICON}<span>Search</span></ui-sidebar-menu-button>
            </ui-sidebar-menu-item>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button tooltip="Settings">${SETTINGS_ICON}<span>Settings</span></ui-sidebar-menu-button>
            </ui-sidebar-menu-item>
          </ui-sidebar-menu>
        </ui-sidebar-group-content>
      </ui-sidebar-group>
    </ui-sidebar-content>
  </ui-sidebar>
  <ui-sidebar-inset>
    <header class="flex h-12 items-center gap-2 border-b px-4">
      <ui-sidebar-trigger></ui-sidebar-trigger>
      <span class="text-sm font-medium">Collapse to icons with the trigger or Ctrl/Cmd+B</span>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4">
      <div class="bg-muted/50 h-24 rounded-xl"></div>
    </div>
  </ui-sidebar-inset>
</ui-sidebar-provider>
`

@customElement({
  name: 'sidebar-icon',
  template: TEMPLATE,
  dependencies: [
    UiSidebarProvider,
    UiSidebar,
    UiSidebarTrigger,
    UiSidebarInset,
    UiSidebarHeader,
    UiSidebarContent,
    UiSidebarGroup,
    UiSidebarGroupLabel,
    UiSidebarGroupContent,
    UiSidebarMenu,
    UiSidebarMenuItem,
    UiSidebarMenuButton,
  ],
})
export class SidebarIcon {}
