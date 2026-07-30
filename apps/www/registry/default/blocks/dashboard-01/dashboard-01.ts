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
} from '@/registry/default/ui/sidebar'
import {
  UiBreadcrumbAttribute,
  UiBreadcrumbListAttribute,
  UiBreadcrumbItemAttribute,
  UiBreadcrumbLinkAttribute,
  UiBreadcrumbPageAttribute,
  UiBreadcrumbSeparatorAttribute,
} from '@/registry/default/ui/breadcrumb'
import {
  UiCard,
  UiCardHeader,
  UiCardTitle,
  UiCardDescription,
  UiCardContent,
} from '@/registry/default/ui/card'
import { UiSeparator } from '@/registry/default/ui/separator'
import { UiBadge } from '@/registry/default/ui/badge'
import { UiChartContainer, type ChartConfig } from '@/registry/default/ui/chart'
import type { ChartData } from '@shadcn-aurelia/primitives'

const HOME_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
const CHART_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>`
const USERS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
const SETTINGS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`

const TEMPLATE = `
<ui-sidebar-provider class="relative min-h-svh w-full">
  <ui-sidebar collapsible="icon" class="absolute h-full">
    <ui-sidebar-header>
      <div class="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold group-data-[collapsible=icon]:hidden">Acme Inc</div>
    </ui-sidebar-header>
    <ui-sidebar-content>
      <ui-sidebar-group>
        <ui-sidebar-group-label>Platform</ui-sidebar-group-label>
        <ui-sidebar-group-content>
          <ui-sidebar-menu>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button tooltip="Dashboard" is-active.bind="true">${HOME_ICON}<span>Dashboard</span></ui-sidebar-menu-button>
            </ui-sidebar-menu-item>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button tooltip="Analytics">${CHART_ICON}<span>Analytics</span></ui-sidebar-menu-button>
            </ui-sidebar-menu-item>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button tooltip="Team">${USERS_ICON}<span>Team</span></ui-sidebar-menu-button>
            </ui-sidebar-menu-item>
            <ui-sidebar-menu-item>
              <ui-sidebar-menu-button tooltip="Settings">${SETTINGS_ICON}<span>Settings</span></ui-sidebar-menu-button>
            </ui-sidebar-menu-item>
          </ui-sidebar-menu>
        </ui-sidebar-group-content>
      </ui-sidebar-group>
    </ui-sidebar-content>
    <ui-sidebar-footer>
      <div class="text-muted-foreground px-2 py-1.5 text-xs group-data-[collapsible=icon]:hidden">shadcn-aurelia</div>
    </ui-sidebar-footer>
    <ui-sidebar-rail></ui-sidebar-rail>
  </ui-sidebar>
  <ui-sidebar-inset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <ui-sidebar-trigger class="-ml-1"></ui-sidebar-trigger>
      <ui-separator orientation="vertical" class="mr-2 h-4"></ui-separator>
      <nav ui-breadcrumb>
        <ol ui-breadcrumb-list>
          <li ui-breadcrumb-item class="hidden md:block"><a ui-breadcrumb-link href="#">Acme Inc</a></li>
          <li ui-breadcrumb-separator class="hidden md:block"></li>
          <li ui-breadcrumb-item><span ui-breadcrumb-page>Dashboard</span></li>
        </ol>
      </nav>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4">
      <div class="grid auto-rows-min gap-4 md:grid-cols-3">
        <ui-card repeat.for="stat of stats">
          <ui-card-header>
            <ui-card-description>\${stat.label}</ui-card-description>
            <ui-card-title class="text-2xl tabular-nums">\${stat.value}</ui-card-title>
          </ui-card-header>
          <ui-card-content>
            <ui-badge variant="outline">\${stat.trend}</ui-badge>
          </ui-card-content>
        </ui-card>
      </div>
      <ui-card>
        <ui-card-header>
          <ui-card-title>Visitors</ui-card-title>
          <ui-card-description>Desktop and mobile visitors for the last 6 months</ui-card-description>
        </ui-card-header>
        <ui-card-content>
          <ui-chart-container type="bar" config.bind="chartConfig" data.bind="chartData"
                              label="Desktop and mobile visitors for the last 6 months"
                              class="max-h-72 min-h-[200px] w-full">
          </ui-chart-container>
        </ui-card-content>
      </ui-card>
    </div>
  </ui-sidebar-inset>
</ui-sidebar-provider>
`

@customElement({
  name: 'dashboard-page',
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
    UiBreadcrumbAttribute,
    UiBreadcrumbListAttribute,
    UiBreadcrumbItemAttribute,
    UiBreadcrumbLinkAttribute,
    UiBreadcrumbPageAttribute,
    UiBreadcrumbSeparatorAttribute,
    UiCard,
    UiCardHeader,
    UiCardTitle,
    UiCardDescription,
    UiCardContent,
    UiSeparator,
    UiBadge,
    UiChartContainer,
  ],
})
export class DashboardPage {
  stats = [
    { label: 'Total revenue', value: '$1,250.00', trend: '+12.5% this month' },
    { label: 'New customers', value: '1,234', trend: '-20% this period' },
    { label: 'Active accounts', value: '45,678', trend: '+12.5% this month' },
  ]

  chartConfig: ChartConfig = {
    desktop: { label: 'Desktop', color: 'var(--chart-1)' },
    mobile: { label: 'Mobile', color: 'var(--chart-2)' },
  }

  chartData: ChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Desktop',
        data: [186, 305, 237, 73, 209, 214],
        backgroundColor: 'var(--color-desktop)',
        borderRadius: 4,
      },
      {
        label: 'Mobile',
        data: [80, 200, 120, 190, 130, 140],
        backgroundColor: 'var(--color-mobile)',
        borderRadius: 4,
      },
    ],
  }
}
