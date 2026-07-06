import { customElement } from 'aurelia'
import {
  UiSidebarProvider,
  UiSidebar,
  UiSidebarTrigger,
  UiSidebarRail,
  UiSidebarInset,
  UiSidebarHeader,
  UiSidebarFooter,
  UiSidebarContent,
  UiSidebarGroup,
  UiSidebarGroupLabel,
  UiSidebarGroupContent,
  UiSidebarMenu,
  UiSidebarMenuItem,
  UiSidebarMenuButton,
  UiSidebarMenuBadge,
  UiSidebarMenuSub,
  UiSidebarMenuSubItem,
  UiSidebarMenuSubButton,
} from '@/registry/default/ui/sidebar'

const HOME_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
const INBOX_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`
const CALENDAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>`
const SETTINGS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`

const TEMPLATE = `
<ui-sidebar-provider class="relative min-h-[480px] w-full overflow-hidden rounded-lg border">
  <ui-sidebar class="absolute h-full">
    <ui-sidebar-header>
      <div class="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold">Acme Inc</div>
    </ui-sidebar-header>
    <ui-sidebar-content>
      <ui-sidebar-group>
        <ui-sidebar-group-label>Platform</ui-sidebar-group-label>
        <ui-sidebar-group-content>
          <ui-sidebar-menu>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button is-active.bind="true">${HOME_ICON}<span>Home</span></ui-sidebar-menu-button>
            </ui-sidebar-menu-item>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button>${INBOX_ICON}<span>Inbox</span></ui-sidebar-menu-button>
              <ui-sidebar-menu-badge>24</ui-sidebar-menu-badge>
            </ui-sidebar-menu-item>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button>${CALENDAR_ICON}<span>Calendar</span></ui-sidebar-menu-button>
              <ui-sidebar-menu-sub>
                <ui-sidebar-menu-sub-item>
                  <ui-sidebar-menu-sub-button href="#"><span>Today</span></ui-sidebar-menu-sub-button>
                </ui-sidebar-menu-sub-item>
                <ui-sidebar-menu-sub-item>
                  <ui-sidebar-menu-sub-button href="#"><span>This week</span></ui-sidebar-menu-sub-button>
                </ui-sidebar-menu-sub-item>
              </ui-sidebar-menu-sub>
            </ui-sidebar-menu-item>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button>${SETTINGS_ICON}<span>Settings</span></ui-sidebar-menu-button>
            </ui-sidebar-menu-item>
          </ui-sidebar-menu>
        </ui-sidebar-group-content>
      </ui-sidebar-group>
    </ui-sidebar-content>
    <ui-sidebar-footer>
      <div class="text-muted-foreground px-2 py-1.5 text-xs">v1.0.0</div>
    </ui-sidebar-footer>
    <ui-sidebar-rail></ui-sidebar-rail>
  </ui-sidebar>
  <ui-sidebar-inset>
    <header class="flex h-12 items-center gap-2 border-b px-4">
      <ui-sidebar-trigger></ui-sidebar-trigger>
      <span class="text-sm font-medium">Dashboard</span>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4">
      <div class="bg-muted/50 h-24 rounded-xl"></div>
      <div class="bg-muted/50 h-24 rounded-xl"></div>
    </div>
  </ui-sidebar-inset>
</ui-sidebar-provider>
`

@customElement({
  name: 'sidebar-demo',
  template: TEMPLATE,
  dependencies: [
    UiSidebarProvider,
    UiSidebar,
    UiSidebarTrigger,
    UiSidebarRail,
    UiSidebarInset,
    UiSidebarHeader,
    UiSidebarFooter,
    UiSidebarContent,
    UiSidebarGroup,
    UiSidebarGroupLabel,
    UiSidebarGroupContent,
    UiSidebarMenu,
    UiSidebarMenuItem,
    UiSidebarMenuButton,
    UiSidebarMenuBadge,
    UiSidebarMenuSub,
    UiSidebarMenuSubItem,
    UiSidebarMenuSubButton,
  ],
})
export class SidebarDemo {}
